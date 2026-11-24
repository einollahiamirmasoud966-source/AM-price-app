import fs from 'fs';
import path from 'path';

const androidMain = path.resolve('android/app/src/main');
if (!fs.existsSync(androidMain)) {
  console.log('android/ folder not generated yet; skipping widget patch.');
  process.exit(0);
}

const javaDir = path.join(androidMain, 'java/com/gheimatalan/app');
const layoutDir = path.join(androidMain, 'res/layout');
const xmlDir = path.join(androidMain, 'res/xml');

fs.mkdirSync(javaDir, { recursive: true });
fs.mkdirSync(layoutDir, { recursive: true });
fs.mkdirSync(xmlDir, { recursive: true });

fs.copyFileSync('android-widget/GheimatWidgetProvider.kt', path.join(javaDir, 'GheimatWidgetProvider.kt'));
fs.copyFileSync('android-widget/widget_gheimat.xml', path.join(layoutDir, 'widget_gheimat.xml'));
fs.copyFileSync('android-widget/gheimat_widget_info.xml', path.join(xmlDir, 'gheimat_widget_info.xml'));

const manifestPath = path.join(androidMain, 'AndroidManifest.xml');
let manifest = fs.readFileSync(manifestPath, 'utf-8');

if (!manifest.includes('GheimatWidgetProvider')) {
  const receiverXml = `
        <receiver
            android:name=".GheimatWidgetProvider"
            android:exported="true">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
                <action android:name="com.gheimatalan.app.WIDGET_REFRESH" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/gheimat_widget_info" />
        </receiver>
    </application>`;
  manifest = manifest.replace('</application>', receiverXml);
  fs.writeFileSync(manifestPath, manifest);
}

console.log('Patched Android project with GheimatWidgetProvider successfully.');
