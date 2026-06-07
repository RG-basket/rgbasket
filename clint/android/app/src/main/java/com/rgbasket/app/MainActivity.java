package com.rgbasket.app;

import android.content.Context;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        final WebView webView = this.getBridge().getWebView();
        if (webView != null) {
            webView.addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void print(final String htmlContent) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            WebView tempWebView = new WebView(MainActivity.this);
                            tempWebView.loadDataWithBaseURL(null, htmlContent, "text/html", "utf-8", null);
                            tempWebView.setWebViewClient(new WebViewClient() {
                                @Override
                                public void onPageFinished(WebView view, String url) {
                                    PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                                    if (printManager != null) {
                                        PrintDocumentAdapter printAdapter = view.createPrintDocumentAdapter("Invoice");
                                        printManager.print("Invoice Print Job", printAdapter, new PrintAttributes.Builder().build());
                                    }
                                }
                            });
                        }
                    });
                }
            }, "AndroidPrint");
        }
    }
}
