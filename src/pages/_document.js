/* eslint-disable react/no-danger */
import React from "react";
import Document, { Html, Main, NextScript, Head } from "next/document";
import sprite from "svg-sprite-loader/runtime/sprite.build";

export default class MyDocument extends Document {
  render() {
    const spriteContent = sprite.stringify();

    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

          <meta name="google-site-verification" content="" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
          <link
            href="https://fonts.googleapis.com/css?family=Fira+Sans:300,300i,400,400i,500,500i"
            rel="stylesheet"
          />

          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/favicon/apple-touch-icon.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/favicon/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/favicon/favicon-16x16.png"
          />
          <link rel="manifest" href="/favicon/site.webmanifest" />
          <link
            rel="mask-icon"
            href="/favicon/safari-pinned-tab.svg"
            color="#5bbad5"
          />
          <script src="/_next/static/runtime-config.js"></script>

          <meta name="msapplication-TileColor" content="#da532c" />
          <meta name="theme-color" content="#ffffff" />
        </Head>
        <body id="__django_nextjs_body">
          <div dangerouslySetInnerHTML={{ __html: spriteContent }} />
          <div id="__django_nextjs_body_begin" />
          <Main />
          <NextScript />
          <div id="__django_nextjs_body_end" />
        </body>
      </Html>
    );
  }
}
