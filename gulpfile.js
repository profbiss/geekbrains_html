'use strict';

var gulp            = require('gulp');
var plugins         = require('gulp-load-plugins')({overridePattern: true, pattern: '*'});
var browserSync     = require('browser-sync').create();
var emitty          = require('emitty').setup('src', 'pug', {makeVinylFile: true});
var imgRetina       = require('gulp-img-retina');
var cssRetina       = require('gulp-css-retina');
var subtree         = require('gulp-subtree');
var git             = require('gulp-git');

var isProduction    = !!plugins.util.env.production;
var env             = isProduction ? "production" : "";

// Plugins options
var browserSyncPort = 9046;
var plumberOptions  = {errorHandler: plugins.notify.onError("Error: <%= error.message %>")};

// CLEAN Folders

gulp.task('clean', function (cb) {
    plugins.rimraf("./dist", cb);
});


gulp.task('commit', function(){
    return gulp.src('./*')
        .pipe(plugins.if(isProduction, git.commit(undefined, {
            args: '-m "Update" -a',
            disableMessageRequirement: true
        })));
});

gulp.task('push', function(done){
    if(isProduction)
        git.push('origin','master', function (err) {
            if (err) throw err;
            done();
        });
    else
        done();
});
gulp.task('subtree', function () {
    return gulp.src('dist')
        .pipe(plugins.if(isProduction, subtree()));
});

// JADE, HTML PAGES

gulp.task('pages', () =>
    new Promise((resolve, reject) => {
        const sourceOptions = global.watch ? { read: false } : {};
        emitty.scan(global.emittyChangedFile).then(() => {
            gulp.src('src/pages/*.pug', sourceOptions)
                .pipe(plugins.plumber(plumberOptions))
                .pipe(plugins.if(global.watch, emitty.filter(global.emittyChangedFile)))
                .pipe(plugins.debug())
                .pipe(plugins.pug({
                    pretty: false,
                    locals: {env: env}
                }))
                .pipe(imgRetina())
                .pipe(plugins.htmlBeautify({
                    indent_char: ' ',
                    indent_size: 4
                }))
                .pipe(gulp.dest("dist/"))
                .on('end', resolve)
                .on('error', reject);
        });
    })
);

gulp.task('validate', function(){
    return gulp.src("dist/*.html")
        .pipe(plugins.plumber(plumberOptions))
        .pipe(plugins.debug())
        .pipe(plugins.w3cjs())
        .pipe(plugins.w3cjs.reporter())
});

gulp.task('pages:watch', gulp.series('pages', function (done) {
    browserSync.reload();
    done();
}));


gulp.task('styles', function(){
    return gulp.src("src/styles/style.styl")
        .pipe(plugins.plumber(plumberOptions))
        .pipe(plugins.stylus({
            'include css': true,
            use: [plugins.autoprefixerStylus({cascade: false})]
        }))
        .pipe(plugins.combineMq({beautify: false}))
        .pipe(plugins.cssbeautify({
            indent: '\t',
            autosemicolon: true
        }))
        .pipe(plugins.csscomb())
        .pipe(cssRetina())
        .pipe(gulp.dest("dist/assets/css/"))
        .pipe(plugins.if(isProduction, plugins.stripCssComments({preserve:false})))
        .pipe(plugins.if(isProduction, plugins.csso()))
        .pipe(plugins.rename({suffix: '.min'}))
        .pipe(gulp.dest("dist/assets/css/"))
        .pipe(browserSync.stream());
});

gulp.task('scripts', function () {
    return gulp.src("src/js/scripts.js")
        .pipe(plugins.plumber(plumberOptions))
        .pipe(plugins.rigger())
        .pipe(plugins.rename('scripts.js'))
        .pipe(gulp.dest("dist/assets/js/"))
        .pipe(plugins.if(isProduction, plugins.uglify()))
        .pipe(plugins.rename({suffix: '.min'}))
        .pipe(gulp.dest("dist/assets/js/"))
});

gulp.task('jquery', function() {
    return gulp.src("src/libs/jquery/jquery-3*.min.js")
        .pipe(plugins.plumber(plumberOptions))
        .pipe(gulp.dest("dist/assets/js/"))
});

gulp.task('images', function () {
    return gulp.src(["src/img/**/*.{jpg,gif,svg,png}","!src/img/**/_*.*"])
        .pipe(plugins.plumber(plumberOptions))
        .pipe(plugins.cache(plugins.imagemin({
            interlaced: true,
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [plugins.imageminPngquant()]
        })))
        .pipe(gulp.dest("dist/assets/img/"))
});

gulp.task('favicons', function() {
    return gulp.src(["src/favicons/*.*","!src/favicons/_*.*"])
        .pipe(plugins.plumber(plumberOptions))
        .pipe(gulp.dest("dist/assets/img/favicons/"))
});

gulp.task('sprite:svg', function () {
    return gulp.src(["src/sprite-svg/*.svg","!src/sprite-svg/_*.svg"])
        .pipe(plugins.svgmin({
            js2svg: {
                pretty: true
            }
        }))
        .pipe(plugins.cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
                $('[stroke]').removeAttr('stroke');
                $('[style]').removeAttr('style');
            },
            parserOptions: {xmlMode: true}
        }))
        .pipe(plugins.replace('&gt;', '>'))
        .pipe(plugins.svgSprite({
            mode: {
                symbol: {
                    sprite: "../img/sprite.svg",
                    render: {
                        styl: {
                            dest:"../styles/sprite-svg.styl",
                            template: "src/sprite-svg/template.styl"
                        }
                    }
                }
            }
        }))
        .pipe(gulp.dest('src/'));
});

gulp.task('sprite:png', function (cb) {
    var spriteData = gulp.src("src/sprite-png/**/*.png")
        .pipe(plugins.plumber(plumberOptions))
        .pipe(plugins.spritesmith({
            retinaSrcFilter: '**/*@2x.png',
            retinaImgName: 'sprite@2x.png',
            retinaImgPath: 'img/sprite@2x.png',
            imgName: 'sprite.png',
            imgPath: 'img/sprite.png',
            cssName: 'sprite-png.styl',
            algorithm: 'binary-tree',
            padding: 10,
            cssTemplate: 'src/sprite-png/sprite-template.mustache'
        }));

    spriteData.img
        .pipe(plugins.plumber(plumberOptions))
        .pipe(plugins.vinylBuffer())
        .pipe(gulp.dest("src/img/"));

    spriteData.css
        .pipe(plugins.plumber(plumberOptions))
        .pipe(plugins.vinylBuffer())
        .pipe(gulp.dest("src/styles/"));

    return spriteData.img
        .pipe(plugins.plumber(plumberOptions))
        .pipe(plugins.vinylBuffer())
});


gulp.task('fonts', function() {
    return gulp.src("src/fonts/**/*.*")
        .pipe(plugins.plumber(plumberOptions))
        .pipe(gulp.dest("dist/assets/fonts/"))
});

gulp.task('php', function() {
    return gulp.src("src/php/*.php")
        .pipe(plugins.plumber(plumberOptions))
        .pipe(gulp.dest("dist/assets/"))
});


gulp.task('watch', () => {

    global.watch = true;
    browserSync.init({
        server: {
            baseDir: "dist/"
        },
        tunnel: false,
        host: 'localhost',
        port: browserSyncPort
    });

    plugins.watch(["src/styles/**/*.styl", "src/blocks/**/*.styl", "!src/blocks/blocks.styl"],
        gulp.series('styles')
    );

    plugins.watch(["src/js/**/*.js","src/blocks/**/*.js", "!src/blocks/blocks.js"],
        gulp.series('scripts', browserSync.reload)
    );

    plugins.watch("src/img/**/*.*",
        gulp.series('images', browserSync.reload)
    );

    plugins.watch("src/favicons/*.*",
        gulp.series('favicons', browserSync.reload)
    );

    plugins.watch("src/sprite-svg/*.*",
        gulp.series('sprite:svg', browserSync.reload)
    );

    // plugins.watch("src/sprite-png/*.png",
    //     gulp.series('sprite:png', browserSync.reload)
    // );

    plugins.watch("src/fonts/**/*.*",
        gulp.series('fonts', browserSync.reload)
    );

    plugins.watch("src/php/*.php",
        gulp.series('php', browserSync.reload)
    );

    gulp.watch(["src/pages/**/*.pug", "src/blocks/**/*.pug"],
        gulp.series('pages:watch')
    ).on('all', (event, filepath) => {
        global.emittyChangedFile = filepath;
    });

});

gulp.task('build', gulp.series(
    'clean',
    'sprite:svg',
    gulp.parallel('images', 'favicons', 'fonts', 'jquery','scripts'),
    'styles',
    'pages',
    'commit',
    'push',
    'subtree'
));

gulp.task('default', gulp.series('build', 'watch'));
