package com.gheimatalan.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.NumberFormat
import java.util.Locale
import kotlin.concurrent.thread

class GheimatWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (ACTION_REFRESH == intent.action) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, GheimatWidgetProvider::class.java))
            onUpdate(context, manager, ids)
        }
    }

    companion object {
        private const val ACTION_REFRESH = "com.gheimatalan.app.WIDGET_REFRESH"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_gheimat)

            val launchIntent = Intent(context, MainActivity::class.java)
            val launchPending = PendingIntent.getActivity(
                context, 0, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root, launchPending)

            val refreshIntent = Intent(context, GheimatWidgetProvider::class.java).apply {
                action = ACTION_REFRESH
            }
            val refreshPending = PendingIntent.getBroadcast(
                context, appWidgetId, refreshIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_refresh_btn, refreshPending)

            thread {
                try {
                    val conn = URL("https://call.tgju.org/ajax.json").openConnection() as HttpURLConnection
                    conn.connectTimeout = 6000
                    conn.readTimeout = 6000
                    conn.setRequestProperty("User-Agent", "GheimatAlanWidget/1.0")
                    val text = conn.inputStream.bufferedReader().readText()
                    val current = JSONObject(text).getJSONObject("current")
                    val fmt = NumberFormat.getNumberInstance(Locale.US)

                    fun formatItem(slug: String, label: String): String {
                        val obj = current.optJSONObject(slug) ?: return "$label: ---"
                        val rawP = obj.optString("p", "0").replace(",", "").toDoubleOrNull() ?: 0.0
                        val toman = (rawP / 10.0).toLong()
                        val dp = obj.optDouble("dp", 0.0)
                        val dt = obj.optString("dt", "")
                        val arrow = if (dt == "high") "▲" else if (dt == "low") "▼" else "•"
                        return "$label: ${fmt.format(toman)} T  $arrow ${String.format(Locale.US, "%.2f", kotlin.math.abs(dp))}%"
                    }

                    views.setTextViewText(R.id.widget_item_1, formatItem("price_dollar_rl", "USD"))
                    views.setTextViewText(R.id.widget_item_2, formatItem("geram18", "18K Gold"))
                    views.setTextViewText(R.id.widget_item_3, formatItem("sekeb", "Bahar Coin"))
                    views.setTextViewText(R.id.widget_item_4, formatItem("crypto-tether-irr", "USDT"))
                    appWidgetManager.updateAppWidget(appWidgetId, views)
                } catch (_: Exception) {
                    appWidgetManager.updateAppWidget(appWidgetId, views)
                }
            }
        }
    }
}
