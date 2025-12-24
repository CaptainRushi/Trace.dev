
import { useEffect, useState, useRef } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useUserStore } from "@/stores/userStore";
import { usePlanStore } from "@/stores/planStore";
import { toast } from "sonner";

export const ProtectedRoute = () => {
    const [session, setSession] = useState<boolean | null>(null);
    const location = useLocation();
    const { fetchUser } = useUserStore();
    const { fetchPlan } = usePlanStore();

    // Use a ref to track if we are currently handling an OAuth redirect
    // This allows us to ignore premature SIGNED_OUT events during the process
    const isProcessingOAuth = useRef(false);

    useEffect(() => {
        let mounted = true;

        // Capture hash existence immediately on mount
        const initialHash = window.location.hash;
        const hasAuthHash = initialHash.includes('access_token') || initialHash.includes('error');

        if (hasAuthHash) {
            isProcessingOAuth.current = true;
        }

        console.log("ProtectedRoute mounted. Hash present:", hasAuthHash);

        const initializeAuth = async () => {
            if (hasAuthHash) {
                console.log("OAuth hash detected, attempting manual session processing...");

                // Try to manually parse tokens from hash
                try {
                    // Remove the # character
                    const paramsString = initialHash.substring(1);
                    const hashParams = new URLSearchParams(paramsString);

                    // Check for error first
                    const error = hashParams.get('error');
                    const errorDescription = hashParams.get('error_description');

                    if (error) {
                        console.error("OAuth Error detected in hash:", error, errorDescription);
                        toast.error(`Login failed: ${errorDescription || error}`);
                        if (mounted) {
                            isProcessingOAuth.current = false;
                            setSession(false);
                        }
                        return;
                    }

                    const access_token = hashParams.get('access_token');
                    const refresh_token = hashParams.get('refresh_token');

                    if (access_token) {
                        console.log("Found access_token in hash, forcing session update...");

                        // Manually set the session
                        const { data, error } = await supabase.auth.setSession({
                            access_token,
                            refresh_token: refresh_token || '',
                        });

                        if (!error && data.session) {
                            console.log("Manual session set successfully!");
                            toast.success("Successfully logged in!");

                            if (mounted) {
                                isProcessingOAuth.current = false; // Done processing
                                setSession(true);
                                fetchUser();
                                fetchPlan();
                                // Clean up URL to remove sensitive tokens
                                window.history.replaceState(null, '', window.location.pathname);
                            }
                            return;
                        } else if (error) {
                            console.error("Manual setSession failed:", error);
                            toast.error("Failed to establish session. Please try again.");
                        }
                    } else {
                        console.warn("Hash has auth indicators but token parsing failed.");
                    }
                } catch (e) {
                    console.error("Error manually parsing hash:", e);
                    toast.error("Error processing login info.");
                }

                // Fallback timeouts if manual parsing failed
                setTimeout(async () => {
                    if (!mounted) return;
                    console.log("Fallback: Checking session...");
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        isProcessingOAuth.current = false;
                        setSession(true);
                        fetchUser();
                        fetchPlan();
                    }
                }, 2000);

                setTimeout(() => {
                    if (mounted) {
                        console.log("Auth timeout (8s), validating final state");
                        supabase.auth.getSession().then(({ data: { session } }) => {
                            if (mounted) {
                                isProcessingOAuth.current = false;
                                if (!session) setSession(false);
                            }
                        });
                    }
                }, 8000);

                return;
            }

            // Normal load - check existing session
            const { data: { session: currentSession }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Session error:', error);
                if (mounted) setSession(false);
                return;
            }

            if (mounted) {
                setSession(!!currentSession);
                if (currentSession) {
                    fetchUser();
                    fetchPlan();
                }
            }
        };

        initializeAuth();

        // Listen for auth state changes from Supabase
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
            if (!mounted) return;

            console.log('ProtectedRoute auth event:', event);

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                isProcessingOAuth.current = false; // Successfully signed in
                setSession(true);
                fetchUser();
                fetchPlan();
            } else if (event === 'SIGNED_OUT') {
                // Only ignore SIGNED_OUT if we are strictly in the middle of processing the initial OAuth hash
                if (!isProcessingOAuth.current) {
                    setSession(false);
                } else {
                    console.log("Ignoring SIGNED_OUT while verifying OAuth hash");
                }
            } else if (event === 'INITIAL_SESSION') {
                // Ignore null session if we are processing OAuth
                if (isProcessingOAuth.current && !currentSession) {
                    return;
                }

                isProcessingOAuth.current = false;
                setSession(!!currentSession);
                if (currentSession) {
                    fetchUser();
                    fetchPlan();
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchUser, fetchPlan]);

    // Loading State
    if (session === null) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Authenticating...</p>

                    <button
                        onClick={() => {
                            setSession(false);
                            window.location.hash = '';
                        }}
                        className="text-xs text-muted-foreground underline hover:text-primary mt-4"
                    >
                        Stuck? Cancel and return to login
                    </button>
                </div>
            </div>
        );
    }

    // Redirect if not authenticated
    if (!session) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    return <Outlet />;
};
