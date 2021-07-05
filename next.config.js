module.exports = {
	webpack: (config, { isServer }) => {
		
		// Fixes npm packages that depend on `fs` module
		if (!isServer) {
			config.node = {
				fs: 'empty',
				module: 'empty'
			}
		}

		config.module.rules.unshift({
			test: /\.worker\.ts/,
			use: {
			  loader: "worker-loader",
			  options: {
				name: "static/[hash].worker.js",
				publicPath: "/_next/"
			  }
			}
		  });
	  
		return config
	}
}
