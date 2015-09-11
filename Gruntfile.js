module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {   
			dist: {
				src: [
					'js/*.js', 
				],
				dest: 'js/build/iz_plugin.js',
				src: [
					'style/*.css', 
				],
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
					require('cssnano')()
                ]
            },
            dist: {
                src: 'dist/*.css'
            }
        },
		watch: {
			scripts: {
				files: ['js/*.js'],
				tasks: ['concat', 'uglify'],
				options: {
					spawn: false,
				}
			},
			styles: {
				files: ['style/*.css'],
				tasks: ['concat', 'postcss'],
				options: {
					spawn: false,
				}
			} 
		}
	});

    grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-postcss');

    grunt.registerTask('default', ['concat', 'uglify', 'postcss:dist']);

};