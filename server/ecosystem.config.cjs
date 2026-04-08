module.exports = {
    apps: [{
        name: 'lpuNodeServer',
        script: './src/lockpickersUnitedServer.conf.js',
        'env': {
            'NODE_ENV': 'production'
        },
        'env_development': {
            NODE_ENV: 'development'
        },
        'env_production': {
            NODE_ENV: 'production'
        }
    }]
}

//tail -f ~/.pm2/logs/lockpickersUnitedServer-out.log
//pm2 start ecosystem.config.cjs --env production
//NODE_ENV=production pm2 start './server/src/cgServer.js' --name 'lpuNodeServer'
