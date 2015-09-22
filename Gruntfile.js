module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // concatenate all scripts and styles into one js and one css file
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
		// minify js
		uglify: {
			build: {
				src: 'js/build/iz_plugin.js',
				dest: 'dist/iz_plugin.min.js'
			}
		},
		// add required prefixes for supported browsers and minify css
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
		// a task for re-generating dist files when scripts and styles change (dev)
		watch: {
			scripts: {
				files: ['js/*.js'],
				tasks: ['concat', 'uglify']
			},
			styles: {
				files: ['style/*.css'],
				tasks: ['concat', 'postcss']
			} 
		},
		
		// release-related tasks
		copy: {
			// prepare wordpress plugin files
			prepare: {
				files: [
					 {expand: true, flatten: true, src: ['dist/**'], dest: 'wordpress/', filter: 'isFile'},
					 {expand: true, flatten: true, src: ['style/*.png'], dest: 'wordpress/'},
					 {expand: true, flatten: true, src: ['style/*.gif'], dest: 'wordpress/'},
				],
			},
			// svn submit to trunk
			svn_trunk: {
				files: [
					 {expand: true, flatten: true, cwd: 'wordpress/', src: ['**'], dest: 'build/<%= pkg.name %>/trunk/'},
				],
			},
			// svn submit to tag
			svn_tag: {
				files: [
					 {expand: true, flatten: true, cwd: 'wordpress/', src: ['**'], dest: 'build/<%= pkg.name %>/tags/<%= pkg.version %>/'},
				],
			}
		},
		// update version number
		replace: {
			reamde_txt: {
				src: [ 'wordpress/readme.txt' ],
				overwrite: true,
				replacements: [{
					from: /Tested up to: (.*)/,
					to: "Tested up to: <%= pkg.wp_version %>"
				}, {
					from: /Stable tag: (.*)/,
					to: "Stable tag: <%= pkg.version %>"
				}]
			},
			init_php: {
				src: [ 'wordpress/informiz.php' ],
				overwrite: true,
				replacements: [{
					from: /Version:\s*(.*)/,
					to: "Version: <%= pkg.version %>"
				}]
			}
		},
		// new version = tag and commit 
		gittag: {
			addtag: {
				options: {
					tag: '<%= pkg.version %>',
					message: 'Version <%= pkg.version %>'
				}
			}
		},
		gitcommit: {
			commit: {
				options: {
					message: 'Plugin version <%= pkg.version %>',
					noVerify: true,
					noStatus: false,
					allowEmpty: true
				},
				files: {
					src: [ 'wordpress/readme.txt', 'wordpress/informiz.php', 'package.json' ]
				}
			}
		},
		gitpush: {
			push: {
				options: {
					tags: true,
					remote: 'origin',
					branch: 'master'
				}
			}
		},
		svn_checkout: {
			make_local: {
				repos: [
					{
					   path: [ 'build' ],
					   repo: 'http://plugins.svn.wordpress.org/informiz'
					}
				]
			}
		},
		push_svn: {
			options: {
				remove: true
			},
			main: {
				src: 'build/<%= pkg.name %>',
				dest: 'http://plugins.svn.wordpress.org/informiz',
				tmp: 'build/make_svn'
			}
		},
		clean: {
			build: ["js/build/**", "style/maps/**"],
			svn: ["build/<%= pkg.name %>/trunk/**"],
			release: ["build/**", "wordpress/**", "!wordpress/*.php", "!wordpress/*.txt"]
		}
	});

    grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-postcss');
	grunt.loadNpmTasks('grunt-contrib-watch');
	
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-text-replace');
	grunt.loadNpmTasks('grunt-git');
	grunt.loadNpmTasks('grunt-svn-checkout');
	grunt.loadNpmTasks('grunt-push-svn');
	grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('default', ['concat', 'uglify', 'postcss:dist', 'clean:build']);
	
	
	grunt.registerTask( 'prep', [ 'replace', 'copy:prepare' ] );
	grunt.registerTask( 'prep_svn', ['prep', 'svn_checkout', 'clean:svn' ] );
	grunt.registerTask( 'do_svn', [ 'copy:svn_trunk', 'copy:svn_tag' ] );
	grunt.registerTask( 'do_git', [  'gitcommit', 'gittag' ] );
	grunt.registerTask( 'release', [ 'prep_svn', 'do_svn', 'do_git', 'clean:post_build' ] );

};