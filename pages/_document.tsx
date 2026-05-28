import Document, { Head, Html, Main, NextScript } from "next/document";

const DESC =
  "An archive of 176 public-domain wallpaper designs and wallcoverings for the mid-Victorian interior, 1840–1860, from the Metropolitan Museum of Art and Cooper Hewitt.";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="icon" href="/favicon.ico" />
          <meta name="description" content={DESC} />
          <meta property="og:site_name" content="vicwallpaper" />
          <meta property="og:description" content={DESC} />
          <meta
            property="og:title"
            content="vicwallpaper — Mid-Victorian Wallcoverings, 1840–1860"
          />
          <meta name="twitter:card" content="summary_large_image" />
          <meta
            name="twitter:title"
            content="vicwallpaper — Mid-Victorian Wallcoverings, 1840–1860"
          />
          <meta name="twitter:description" content={DESC} />
        </Head>
        <body className="bg-black antialiased">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
