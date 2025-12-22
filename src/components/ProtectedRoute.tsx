
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useUserStore } from "@/stores/userStore";

export const ProtectedRoute = () => {
    const [session, setSession] = useState<boolean | null>(null);
    const location = useLocation();

    const { fetchUser } = useUserStore();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(!!session);
            if (session) fetchUser();
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(!!session);
            if (session) fetchUser();
        });

        return () => subscription.unsubscribe();
    }, []);

    if (session === null) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    return <Outlet />;
};
