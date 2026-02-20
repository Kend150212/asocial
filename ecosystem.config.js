module.exports = {
    apps: [
        {
            name: 'asocial-web',
            script: 'npm',
            args: 'start',
            cwd: '/home/flashvps/asocial.kendymarketing.com',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            restart_delay: 5000,
            max_restarts: 10,
        },
        {
            name: 'asocial-worker',
            script: 'npx',
            args: 'tsx src/server.ts',
            cwd: '/home/flashvps/asocial.kendymarketing.com',
            interpreter: 'none',
            env: {
                NODE_ENV: 'production',
            },
            restart_delay: 5000,
            max_restarts: 10,
        },
    ],
}
