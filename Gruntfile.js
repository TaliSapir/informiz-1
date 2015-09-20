module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {   
			js: {
				src: ['js/*.js'],
				dest: 'js/build/iz_plugin.js',
			},
			css: {
				src: ['style/*.css'],
				dest: 'dist/iz_plugin.css',
			}
		},
		uglify: {
			build: {
				src: 'js/build/iz_plugin.js',
				dest: 'dist/iz_plugin.min.js'
			}
		},
		postcss: {
            options: {
				map: {
					inline: false, 
					annotation: 'style/maps/' 
				},
                processors: [
                    require('autoprefixer')({
                        browsers: ['> 1%']
                    }),
					require('cssnano')({zindex: false})
                ]
            },
            dist: {
                src: 'dist/*.css'
            }
        },
		watch: {
			scripts: {
				files: ['js/*.js'],
				tasks: ['concat', 'uglify']
			},
			styles: {
				files: ['style/*.css'],
				tasks: ['concat', 'postcss']
			} 
		}
	});

    grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-postcss');
	grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['concat', 'uglify', 'postcss:dist']);

};