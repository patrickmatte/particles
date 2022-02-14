const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

function pageTemplate(config) {
  return `
  <!DOCTYPE html>
  <html lang="en" class="${config.class}">
    <head>
      <title>${config.title}</title>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0"/>
      ${config.head}
    </head>
    <body>
        ${config.body}
    </body>
    </html>
  `;
}

module.exports = (env, argv) => {
  const isDev = argv.mode == 'development';

  let entry = {
    bundle: ['./js/main.js', './css/main.pcss'],
  };

  const plugins = [new MiniCssExtractPlugin()];

  const htmlFiles = [
    {
      template: pageTemplate,
      title: 'branches',
      filename: 'branches.html',
      class: 'branches',
      head: ``,
      oldhead: `<link href="./assets/fonts/fonts.css" rel="stylesheet">`,
      body: `
        <script>
          window.Branches();
        </script>
      `,
    },
    {
      template: pageTemplate,
      title: 'tree',
      filename: 'tree.html',
      class: 'tree',
      head: ``,
      oldhead: `<link href="./assets/fonts/fonts.css" rel="stylesheet">`,
      body: `
        <script>
          window.Tree();
        </script>
      `,
    },
    {
      template: pageTemplate,
      title: 'demo2',
      filename: 'demo2.html',
      class: 'demo demo2',
      head: ``,
      oldhead: `<link href="./assets/fonts/fonts.css" rel="stylesheet">`,
      body: `
        <script>
          window.Demo2();
        </script>
      `,
    },
    {
      template: pageTemplate,
      title: 'demo1',
      filename: 'demo1.html',
      class: 'demo demo1',
      head: ``,
      oldhead: `<link href="./assets/fonts/fonts.css" rel="stylesheet">`,
      body: `
        <script>
          window.Demo1();
        </script>
      `,
    },
    {
      template: pageTemplate,
      title: 'particles cloud',
      filename: 'particles-cloud.html',
      class: 'particles cloud',
      head: ``,
      oldhead: `<link href="./assets/fonts/fonts.css" rel="stylesheet">`,
      body: `
        <script>
          window.ParticlesCloud();
        </script>
      `,
    },
    {
      template: pageTemplate,
      title: 'particles instanced',
      filename: 'particles-instanced.html',
      class: 'particles instanced',
      head: ``,
      body: `
        <script>
          window.MainInstanced();
        </script>
      `,
    },
    {
      template: pageTemplate,
      title: 'particles points',
      filename: 'particles.html',
      class: 'particles points',
      head: ``,
      body: `
        <script>
          window.MainPoints();
        </script>
      `,
    },
    {
      template: pageTemplate,
      title: 'fresnel',
      filename: 'fresnel.html',
      class: 'fresnel',
      head: ``,
      body: `
        <script>
          window.Cloud();
        </script>
      `,
    },
    {
      template: pageTemplate,
      title: 'datatest',
      filename: 'datatest.html',
      class: 'datatest',
      head: ``,
      body: `
        <script>
          window.DataTest();
        </script>
      `,
    },
    {
      template: pageTemplate,
      title: 'raycast',
      filename: 'raycast.html',
      class: 'raycast',
      head: ``,
      body: `
        <script>
          window.RayCast();
        </script>
      `,
    },
  ];

  let links = '<ul>';
  htmlFiles.forEach((htmlFile) => {
    links += `<li><a href="${htmlFile.filename}">${htmlFile.title}</a></li>`;
  });
  links += '</ul>';

  htmlFiles.push({
    template: pageTemplate,
    title: 'index',
    filename: 'index.html',
    class: 'index',
    head: '',
    body: links,
  });

  htmlFiles.forEach((htmlFile) => {
    plugins.push(
      new HtmlWebpackPlugin({
        templateContent: htmlFile.template(htmlFile),
        filename: htmlFile.filename,
        env: argv.mode,
        inject: 'head',
        scriptLoading: 'blocking',
      })
    );
  });

  if (isDev) {
    plugins.push(new webpack.SourceMapDevToolPlugin());
  }

  return {
    entry,
    context: path.resolve(__dirname, 'src'),
    target: 'web',
    devtool: false,
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: '[name].js',
      publicPath: './',
    },
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
    },
    mode: 'development',
    module: {
      rules: [
        {
          test: /\.(sa|sc|pc|c)ss$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                publicPath: './',
              },
            },
            'css-loader',
            'postcss-loader',
          ],
        },
        {
          test: /\.(js|jsx)$/,
          exclude: /(node_modules|bower_components)/,
          loader: 'babel-loader',
        },
        {
          test: /\.(xml|svg|txt|md|hbs|mustache|glsl)$/,
          use: 'raw-loader',
        },
        {
          test: /\.(woff2?|ttf|eot)(\?.*)?$/i,
          use: 'file-loader?name=fonts/[name].[ext]',
        },
        {
          test: /\.(svg|jpe?g|png|gif)(\?.*)?$/i,
          use: 'file-loader?name=img/[name].[ext]',
        },
        {
          test: /\.csv$/,
          loader: 'csv-loader',
          options: {
            dynamicTyping: true,
            header: true,
            skipEmptyLines: true,
          },
        },
      ],
    },
    plugins: plugins,
    stats: { colors: true },
    devServer: {
      port: process.env.PORT || 9001,
      host: process.env.HOST || '0.0.0.0',
      disableHostCheck: true,
      publicPath: '/',
      contentBase: './build',
      // https: true,
    },
  };
};
