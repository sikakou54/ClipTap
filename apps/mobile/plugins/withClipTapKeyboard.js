const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Android IME（拡張キーボード）の定義を AndroidManifest.xml へ注入するExpo config plugin
 *
 * `expo prebuild` は AndroidManifest.xml をテンプレートから作り直すため、
 * 手で書いた <service> は毎回消える。これまでは実行のたびに人手で戻していたが、
 * 戻し忘れてもビルドは成功し、実行時にキーボードが選択肢に出ないという形で
 * 静かに壊れるため気付きにくい。
 *
 * ここで注入すれば prebuild を何度実行しても定義が保たれる。
 *
 * 注意: レイアウト・drawable・res/xml/method.xml・Kotlinソースなど他のネイティブ資産は
 * リポジトリにコミット済みのため、prebuild が消した場合は git から復元できる。
 * AndroidManifest.xml だけは prebuild が正当に書き換えるファイルであり、
 * git で戻すとテンプレート側の更新を失うため、この plugin で合流させる。
 */

/** IMEサービスの名前。app/src/main/java/com/sikakou/cliptap/keyboard/ClipTapKeyboardService.kt に対応する */
const SERVICE_NAME = '.keyboard.ClipTapKeyboardService';

/**
 * IMEサービスの定義を組み立てる
 *
 * `android:permission` に BIND_INPUT_METHOD を指定することで、
 * システムだけがこのサービスへ接続できるようになる（IMEの必須要件）。
 */
function buildKeyboardService() {
  return {
    $: {
      'android:name': SERVICE_NAME,
      'android:label': 'ClipTap',
      'android:permission': 'android.permission.BIND_INPUT_METHOD',
      'android:exported': 'true',
    },
    'intent-filter': [
      {
        action: [{ $: { 'android:name': 'android.view.InputMethod' } }],
      },
    ],
    /* IMEのメタデータ。res/xml/method.xml がキーボードの表示名やsubtypeを定義する */
    'meta-data': [
      {
        $: {
          'android:name': 'android.view.im',
          'android:resource': '@xml/method',
        },
      },
    ],
  };
}

/**
 * @param {import('expo/config').ExpoConfig} config
 */
function withClipTapKeyboard(config) {
  return withAndroidManifest(config, (modConfig) => {
    const application = modConfig.modResults.manifest.application?.[0];

    if (!application) {
      throw new Error(
        'AndroidManifest.xml に <application> が見つからないため、IME定義を注入できません'
      );
    }

    const services = application.service ?? [];

    /* 二重実行や既存の手書き定義と重複しないよう、同名のものを除いてから追加する */
    application.service = [
      ...services.filter((service) => service.$?.['android:name'] !== SERVICE_NAME),
      buildKeyboardService(),
    ];

    return modConfig;
  });
}

module.exports = withClipTapKeyboard;
