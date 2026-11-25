import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import React from 'react';
import AuthenticatedLayout from './Layouts/AuthenticatedLayout';

const appName = import.meta.env.VITE_APP_NAME || 'Master Summit';

// Global persistent layout reference function (ensures same identity across all page transitions)
const defaultLayout = (page: React.ReactNode) => <AuthenticatedLayout>{page}</AuthenticatedLayout>;

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx')
        ).then((module: any) => {
            if (module.default.layout === undefined) {
                if (!name.startsWith('Auth/') && !name.startsWith('Portal/') && name !== 'Welcome') {
                    module.default.layout = defaultLayout;
                }
            }
            return module;
        }),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#18181b', // zinc-900 minimalist progress bar
        showSpinner: false,
    },
});
