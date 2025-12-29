export interface DocSection {
    id: string;
    title: string;
    content: string;
}

export const DOCS_DATA: DocSection[] = [
    {
        id: 'introduction',
        title: 'Introduction',
        content: `
            <h1>Introduction</h1>
            <p>Welcome to <strong>Trace.dev</strong>, the all-in-one SaaS platform designed to bridge the gap between planning and implementation for modern developers and architects.</p>
            
            <h3>What Trace.dev does</h3>
            <p>Trace.dev provides a powerful suite of tools for project management, database design, and visual diagramming. It allows you to transform abstract ideas into structured database schemas and visual flows, and then converts those designs directly into production-ready code.</p>
            
            <h3>Who it is for</h3>
            <ul>
                <li><strong>Individual Developers:</strong> Streamline your workflow from idea to code.</li>
                <li><strong>Architects:</strong> Design complex system structures and database schemas visually.</li>
                <li><strong>Teams:</strong> Coordinate projects and visualize shared data structures.</li>
            </ul>
            
            <h3>Key Problems Solved</h3>
            <ul>
                <li><strong>Design-to-Code Gap:</strong> No more manual translation of diagrams into SQL or boilerplate code.</li>
                <li><strong>Fragmented Workflows:</strong> Instead of using three different tools for tasks, databases, and diagrams, use Trace.dev.</li>
                <li><strong>Complex Schema Management:</strong> Visualize relationships clearly to avoid architectural mistakes.</li>
            </ul>
            
            <div class="note bg-indigo-500/10 border-l-4 border-indigo-500 p-4 my-6">
                <strong>Note:</strong> Trace.dev is built for speed. Every feature is designed to move you closer to your deployment goals.
            </div>
        `
    },
    {
        id: 'getting-started',
        title: 'Getting Started',
        content: `
            <h1>Getting Started</h1>
            <p>Setting up your Workspace on Trace.dev is quick and straightforward.</p>
            
            <h3>1. Account Creation</h3>
            <p>To get started, click the <strong>Sign Up</strong> button on the landing page. We support secure Google OAuth for instant access, or you can register with your email and password.</p>
            
            <h3>2. Login Process</h3>
            <p>Once registered, use the <strong>Login</strong> page to access your dashboard. Your session will be securely maintained, allowing you to pick up exactly where you left off.</p>
            
            <h3>3. Dashboard Overview</h3>
            <p>The Dashboard is your command center. Here you will see:</p>
            <ul>
                <li><strong>Profile Section:</strong> Your streak, tasks completed, and active projects.</li>
                <li><strong>Active Projects:</strong> A quick-access list of your most recent work.</li>
                <li><strong>Task Calendar:</strong> A visual representation of your planned schedule.</li>
            </ul>
            
            <h3>4. Navigation Explanation</h3>
            <ul>
                <li><strong>Sidebar:</strong> Navigate between your projects, sync your subscription status, or upgrade your plan.</li>
                <li><strong>Terminal Tabs:</strong> Inside a project, use tabs like "Overview", "Daily Log", "Database", and "TraceDraw" to switch contexts.</li>
                <li><strong>Top Actions:</strong> Access project settings or create new assets from the top bar within specific modules.</li>
            </ul>
        `
    },
    {
        id: 'projects',
        title: 'Projects',
        content: `
            <h1>Projects</h1>
            <p>In Trace.dev, a <strong>Project</strong> is a dedicated workspace for a specific idea or application.</p>
            
            <h3>What is a Project?</h3>
            <p>Each project contains its own set of database schemas, TraceDraw diagrams, daily logs, and code vault entries. This isolation ensures that your work across different applications remains organized and focused.</p>
            
            <h3>How to Create a Project</h3>
            <ol>
                <li>Click the <strong>"New Project"</strong> button in the sidebar.</li>
                <li>Enter a project name and a brief description.</li>
                <li>Click <strong>"Create"</strong> to initialize your new workspace.</li>
            </ol>
            
            <div class="tip bg-green-500/10 border-l-4 border-green-500 p-4 my-6">
                <strong>Tip:</strong> Use clear, descriptive names for your projects to make them easier to find as your portfolio grows.
            </div>
        `
    },
    {
        id: 'daily-logs',
        title: 'Daily Logs',
        content: `
            <h1>Daily Logs</h1>
            <p>The <strong>Daily Log</strong> is your personal development journal where you can record progress, challenges, and thoughts for every project.</p>
            
            <h3>Using the Editor</h3>
            <p>We provide a streamlined editor that allows you to jot down what you worked on each day. This is immensely helpful for context-switching and tracking long-term progress.</p>
            
            <h3>Autosave</h3>
            <p>Your logs are saved automatically as you type, ensuring that no thought is lost. Each project maintains its own history of logs.</p>
        `
    },
    {
        id: 'daily-tasks',
        title: 'Daily Tasks',
        content: `
            <h1>Daily Tasks</h1>
            <p>Manage your workload efficiently with the <strong>Daily Tasks</strong> module.</p>
            
            <h3>Task Management</h3>
            <ul>
                <li><strong>Create:</strong> Quickly add tasks by typing in the input field.</li>
                <li><strong>Schedule:</strong> Assign tasks to specific dates to plan your week.</li>
                <li><strong>Complete:</strong> Toggle task completion to see your progress in real-time.</li>
            </ul>
        `
    },
    {
        id: 'calendar',
        title: 'Workload Calendar',
        content: `
            <h1>Workload Calendar</h1>
            <p>The <strong>Calendar</strong> provides a bird's-eye view of your productivity across the month.</p>
            
            <h3>Visualizing Progress</h3>
            <p>The calendar displays your planned tasks and completed items. It helps you identify "overloaded" days with visual alerts, allowing you to rebalance your schedule for better focus.</p>
        `
    },
    {
        id: 'code-vault',
        title: 'Code Vault',
        content: `
            <h1>Code Vault</h1>
            <p>The <strong>Code Vault</strong> is a secure, version-controlled repository for your project's critical scripts and snippets.</p>
            
            <h3>Containers & Files</h3>
            <p>Organize your code into <strong>Containers</strong> (e.g., "Backend", "Landing Page"). Inside each container, you can manage multiple files with full syntax highlighting.</p>
            
            <h3>Version History</h3>
            <p>Every save creates a new version. You can browse through the history, compare changes between versions, and restore previous states at any time.</p>
        `
    },
    {
        id: 'api-keys',
        title: 'API Keys',
        content: `
            <h1>API Keys</h1>
            <p>Keep your external service credentials organized and secure with the <strong>API Key Vault</strong>.</p>
            
            <h3>Secure Storage</h3>
            <p>Store your keys with descriptive names and values. While the keys are encrypted for security, you can easily view or copy them when you need to integrate with external services like Stripe, AWS, or OpenAI.</p>
        `
    },
    {
        id: 'database-visualization',
        title: 'Database Visualization',
        content: `
            <h1>Database Visualization</h1>
            <p>The Database Designer is one of Trace.dev's core premium features, allowing you to build PostgreSQL-compatible schemas visually.</p>
            
            <h3>What is Database Visualization?</h3>
            <p>Instead of writing raw SQL commands, you can drag and drop tables, define columns, and draw connections between foreign keys using a visual canvas. Trace.dev handles the underlying complexity of standardizing your schema.</p>
            
            <h3>How to Use:</h3>
            <ul>
                <li><strong>Create Tables:</strong> Click "Add Table" in the toolbar to place a new table on the canvas.</li>
                <li><strong>Define Columns:</strong> Click on a table to open the Properties Panel where you can add columns, set data types (Integer, Text, UUID, etc.), and toggle Primary/Foreign key constraints.</li>
                <li><strong>Connect Tables:</strong> Switch to the <strong>Connect Tool</strong> and drag a line from one column's anchor to another to establish a relationship.</li>
            </ul>
            
            <h3>Transforming to Code</h3>
            <p>Once your visual design is ready, switch to the <strong>"Code" mode</strong> in the toolbar. Trace.dev will automatically generate the corresponding PostgreSQL SQL script for your design.</p>
            
            <h3>Downloading Code</h3>
            <p>You can export your database schema by clicking the <strong>"Export"</strong> button and selecting <strong>"Download .sql"</strong>. This file can be imported directly into any PostgreSQL-compatible database.</p>
            
            <div class="warning bg-amber-500/10 border-l-4 border-amber-500 p-4 my-6">
                <strong>Warning:</strong> Database Visualization is a premium feature. Free users can view the project overview but must upgrade to access the Visual Editor and Code Export.
            </div>
        `
    },
    {
        id: 'tracedraw',
        title: 'TraceDraw',
        content: `
            <h1>TraceDraw</h1>
            <p>TraceDraw is a collaborative whiteboard tool integrated directly into your projects, perfect for architecture planning and flow design.</p>
            
            <h3>Purpose</h3>
            <p>Use TraceDraw to map out user flows, microservice architectures, or brainstorm UI layouts before you start building. It’s your digital napkin for architectural thinking.</p>
            
            <h3>Standard Workflows:</h3>
            <ul>
                <li><strong>Create Diagrams:</strong> Use the shape tools (rectangles, circles, arrows) to build your diagram.</li>
                <li><strong>Drawing Flows:</strong> Use the freehand tool or arrow connectors to show how data or users move through your system.</li>
                <li><strong>Editing:</strong> You can select, resize, and recolor any element on the canvas to refine your design.</li>
            </ul>
            
            <h3>Export and Download</h3>
            <p>Need to include your diagram in a presentation or README? Click the <strong>"Download PNG"</strong> button in TraceDraw to save a high-resolution image of your current workspace.</p>
            
            <div class="note bg-indigo-500/10 border-l-4 border-indigo-500 p-4 my-6">
                <strong>Note:</strong> TraceDraw persistence ensures your drawings are saved to the cloud and available every time you return to the project.
            </div>
        `
    },
    {
        id: 'downloads',
        title: 'Downloads',
        content: `
            <h1>Downloads</h1>
            <p>Trace.dev empowers you to take your designs out of our platform and into your production environment.</p>
            
            <h3>Available Content:</h3>
            <ul>
                <li><strong>SQL Schemas:</strong> Exported as .sql files from the Database Designer.</li>
                <li><strong>Diagrams:</strong> Exported as high-resolution PNG images from TraceDraw.</li>
                <li><strong>Vaulted Code:</strong> While code in the vault is primarily for internal reference, you can easily copy content to your clipboard for use in your editors.</li>
            </ul>
            
            <h3>File Formats</h3>
            <ul>
                <li><strong>Database:</strong> .sql (PostgreSQL optimized)</li>
                <li><strong>Visuals:</strong> .png</li>
            </ul>
            
            <h3>Where are files saved?</h3>
            <p>Downloaded files are saved directly to your browser's default download folder (usually "Downloads").</p>
            
            <div class="tip bg-green-500/10 border-l-4 border-green-500 p-4 my-6">
                <strong>Tip:</strong> Premium plans allow for unlimited downloads of all generated assets.
            </div>
        `
    },
    {
        id: 'pricing-plans',
        title: 'Pricing & Plans',
        content: `
            <h1>Pricing & Plans</h1>
            <p>We offer transparent pricing designed to scale with your needs as a developer.</p>
            
            <h3>Free Plan</h3>
            <p>Perfect for exploring the platform and managing basic project logs.</p>
            <ul>
                <li>Access to Dashboard and Project Overviews.</li>
                <li>Unlimited Daily Logs and Task management.</li>
                <li><strong>Locked:</strong> Database Designer, TraceDraw, and Code Exports.</li>
            </ul>
            
            <hr class="my-6 border-border/40" />
            
            <h3>Monthly Plan – ₹499</h3>
            <p>The standard professional plan for active developers.</p>
            <ul>
                <li><strong>Unlimited Projects:</strong> No limits on your creativity.</li>
                <li><strong>Full Database Visualization:</strong> Visual schema editor and SQL generation.</li>
                <li><strong>TraceDraw Access:</strong> Full visual diagramming and PNG exports.</li>
                <li><strong>Unlimited Downloads:</strong> Export your code and designs anytime.</li>
                <li>Flexiblity to cancel anytime with monthly billing.</li>
            </ul>
            
            <hr class="my-6 border-border/40" />
            
            <h3>Yearly Plan – ₹5,699</h3>
            <p><strong>Best Value</strong> for long-term users.</p>
            <ul>
                <li><strong>All Monthly Plan Features:</strong> Complete access to every tool.</li>
                <li><strong>Cost Savings:</strong> Save ₹289 per year compared to the monthly cost.</li>
                <li><strong>Convenience:</strong> One payment for 365 days of uninterrupted access.</li>
            </ul>
        `
    },
    {
        id: 'subscription-management',
        title: 'Subscription Management',
        content: `
            <h1>Subscription Management</h1>
            <p>Managing your plan is simple and integrated through our Razorpay secure payment gateway.</p>
            
            <h3>Upgrading Your Plan</h3>
            <p>Visit the <strong>Pricing</strong> page via the sidebar. Select your preferred plan (Monthly or Yearly) and complete the secure payment. Your account will be upgraded immediately upon verification.</p>
            
            <h3>Switching Plans</h3>
            <p>You can switch from a Monthly to a Yearly plan at any time to take advantage of the discount. The new yearly term will begin immediately upon payment.</p>
            
            <h3>Renewal & Expiry</h3>
            <ul>
                <li><strong>Renewal:</strong> Subscriptions are valid for the purchased term (30 days for Monthly, 365 days for Yearly).</li>
                <li><strong>Expiry:</strong> If a subscription is not renewed, your account will automatically revert to the "Free" plan.</li>
                <li><strong>Policy:</strong> Upon reverting to Free, your existing data remains safe, but premium features like the Database Designer and TraceDraw will become "Locked" until a new plan is active.</li>
            </ul>
        `
    },
    {
        id: 'feature-access-rules',
        title: 'Feature Access Rules',
        content: `
            <h1>Feature Access Rules</h1>
            <p>Trace.dev uses a dynamic access model to ensure you always know what tools are available to you.</p>
            
            <h3>No Plan (Free)</h3>
            <p>You can create and manage project overviews and tasks. Premium modules like "Database" and "TraceDraw" will display a "Locked" state. Clicking these will show an upgrade prompt.</p>
            
            <h3>Plan Expiry</h3>
            <p>When a plan expires, your data is <strong>never deleted</strong>. You can still see your project list and history. However, the interactive editors for Database schemas and Diagrams will return to a read-only or locked state until access is restored.</p>
            
            <h3>Upgrade Prompts</h3>
            <p>Throughout the app, you may see <strong>Crown icons</strong> or <strong>Upgrade buttons</strong>. These are quick shortcuts to help you unlock the full power of the platform when you need it most.</p>
        `
    },
    {
        id: 'faqs',
        title: 'FAQs',
        content: `
            <h1>Frequently Asked Questions</h1>
            
            <h3>Can I create unlimited projects?</h3>
            <p>Yes, on any paid plan (Monthly or Yearly), there are no limits on the number of projects you can create and manage.</p>
            
            <h3>What happens to my data if my plan expires?</h3>
            <p>Your data is safe. We do not delete your projects, schemas, or diagrams. You simply lose the ability to edit or export them until a plan is reactivated.</p>
            
            <h3>Can I download diagrams for free?</h3>
            <p>Exporting diagrams as PNG and schemas as SQL is a premium feature available only on paid plans.</p>
            
            <h3>Are Monthly and Yearly features the same?</h3>
            <p>Yes. Both plans grant 100% access to all features on the platform. The only difference is the billing cycle and the cost savings on the Yearly plan.</p>
            
            <h3>Can I upgrade anytime?</h3>
            <p>Absolutely. You can upgrade from the Pricing page at any time. The upgrade is processed in real-time.</p>
        `
    },
    {
        id: 'support-help',
        title: 'Support & Help',
        content: `
            <h1>Support & Help</h1>
            <p>We are dedicated to providing the best experience possible. If you encounter issues, we are here to help.</p>
            
            <h3>Reporting Bugs</h3>
            <p>If you find a technical issue or bug, please report it via the "Feedback" button in the dashboard or contact us at <a href="mailto:rushikeshbodke574@gmail.com" class="text-primary hover:underline">rushikeshbodke574@gmail.com</a>.</p>
            
            <h3>Support Hours</h3>
            <p>Our team reviews support requests Monday through Friday. You can typically expect a response within 24–48 hours for standard queries.</p>
            
            <div class="note bg-indigo-500/10 border-l-4 border-indigo-500 p-4 my-6">
                <strong>Tip:</strong> When reporting a bug, please include your browser name and the steps you took leading up to the issue.
            </div>
        `
    }
];
