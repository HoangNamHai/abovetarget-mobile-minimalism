# Runbook: Upload app lên Apple App Store (PMP Exam Pro)

> Quy trình end-to-end **đã chạy thành công** để build, ký, upload và submit
> app iOS lên App Store Connect (ASC). Mục đích: lần sau chạy nhanh hơn, ít lỗi
> hơn. Phần prose bằng tiếng Việt; lệnh/code giữ nguyên tiếng Anh.
>
> - Quyết định công cụ (vì sao dùng `asc` thay vì Fastlane `deliver`): xem
>   [`ios-release-tooling.md`](./ios-release-tooling.md).
> - Recipe build/sign chi tiết: memory `ios-release-build`.
> - Lần submit gần nhất: **1.1.0 (2)**, free build, iPhone-only, submit 2026-06-24.

---

## 0. TL;DR — thứ tự 13 bước

| # | Bước | Công cụ chính | Check sau khi xong |
|---|------|---------------|--------------------|
| 1 | Pre-flight config (free gating, Clerk key, version) | đọc file | grep bundle |
| 2 | Bump version + build number | sửa 3 file | 3 file khớp nhau |
| 3 | Chuẩn bị keychain ký (project-local) | `security` | `security find-identity` thấy cert |
| 4 | Archive | `xcodebuild archive` | có `.xcarchive` |
| 5 | Export IPA | `xcodebuild -exportArchive` | có `PMPExamPro.ipa` |
| 6 | Upload binary | `xcrun altool` | "UPLOAD SUCCEEDED" |
| 7 | Đợi build lên ASC + tạo/đổi tên version record | `asc` | build state `VALID` |
| 8 | Attach build vào version | `asc` / API | version có build |
| 9 | Export compliance (encryption) | API PATCH / `asc encryption` | `usesNonExemptEncryption=false` |
| 10 | Content rights | `asc apps update` | `DOES_NOT_USE_THIRD_PARTY_CONTENT` |
| 11 | Screenshots (idempotent) | ASC API | đếm đúng N, không nhân đôi |
| 12 | App Privacy | Fastlane / ASC web | published |
| 13 | Submit + monitor | `asc submit` / `asc status` | `WAITING_FOR_REVIEW` |

> Mẹo: chạy `asc validate --app <APP_ID>` **trước** khi submit — nó liệt kê
> đúng các blocker còn thiếu (đỡ phải submit-fail-sửa nhiều vòng).

---

## 1. Thông tin cố định (không đổi giữa các lần release)

| Khoản | Giá trị |
|-------|---------|
| App name | **PMP Exam Pro** |
| Bundle ID | `com.h2ai.pmpexampro` |
| ASC App ID | `6782658779` |
| Apple Team ID | `A2856ZD38W` (Phan Thien Dao Nguyen) |
| `asc` profile | `PMP-DaoNguyen` (mặc định) |
| ASC API Key ID | `G3CD625ZNS` |
| ASC API Issuer ID | `48d421d0-29a7-4799-97ee-4330306500d9` |
| API key file (.p8) | `~/.appstoreconnect/private_keys/AuthKey_G3CD625ZNS.p8` |
| Provisioning profile | `PMP App Store` (hết hạn 2027-06-21) |
| Distribution cert | `iPhone Distribution: Phan Thien Dao Nguyen (A2856ZD38W)` |
| Keychain ký (project-local) | `signing/pmp.keychain-db`, pass `pmp-build-local` |
| p12 trong keychain | `signing/pmp-login.p12`, pass `pmp1234` |
| Demo account cho reviewer | `appstore.review@abovetarget.org` (Clerk dev + prod) |

> Thư mục `signing/` đã được gitignore (`/signing/`, `*.p12`, `*.keychain-db`,
> `*.mobileprovision`). **Không bao giờ commit.** Khóa `.p8` ở repo root cũng
> đã gitignore.

---

## 2. Prerequisites (cài 1 lần / kiểm tra đầu mỗi lần)

```bash
# Công cụ
which asc            # /opt/homebrew/bin/asc  (>= 0.44)
xcrun --version
xcodebuild -version

# Auth ASC API key đã cấu hình đúng chưa
asc doctor                       # chẩn đoán cấu hình auth
asc apps list                    # phải thấy app 6782658779

# Python deps cho JWT (chỉ cần cho các thao tác gọi REST API thô)
python3 -c "import jwt, cryptography"   # pyjwt + cryptography
```

Nếu `asc apps list` lỗi auth → kiểm tra key `.p8`, key id, issuer id ở
`~/.appstoreconnect/` hoặc biến môi trường `ASC_KEY_ID` / `ASC_ISSUER_ID`.

---

## 3. Pre-flight checks (TRƯỚC khi build — tránh build lại)

Đây là các check quan trọng nhất; bỏ qua là phải rebuild (mỗi lần ~10-15 phút).

### 3.1 Free gating (RevenueCat tắt)
```bash
cat .env.production    # phải có: EXPO_PUBLIC_REVENUECAT_ENABLED=false
```
- `.env.production` được `@expo/env` nạp **trước** `.env` ở Release build, nên
  giá trị này thắng. Kết quả: paywall ẩn, mọi user = premium, 51 lessons mở.
- ⚠️ EXPO_PUBLIC_* được Metro **inline tĩnh** lúc bundle → đổi env phải
  rebuild bundle mới có hiệu lực.

### 3.2 Clerk key (login)
```bash
grep CLERK_PUBLISHABLE .env .env.production
```
- `.env.production` **không** set Clerk key → key rơi xuống `.env`.
- 🔴 Hiện `.env` đang active `pk_test_...` (Clerk **dev instance**), `pk_live_`
  bị comment. App submit hiện dùng **test instance**. Trước khi launch thật nên
  thêm `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...` vào `.env.production`.
- Login là tính năng **độc lập** với free/paid; "free" không tắt login.

### 3.3 Device family (iPhone-only hay có iPad)
```bash
grep TARGETED_DEVICE_FAMILY ios/PMPExamPro.xcodeproj/project.pbxproj
# "1"   = iPhone-only  (đỡ phải làm screenshot iPad)
# "1,2" = iPhone + iPad (bắt buộc phải có screenshot iPad khi submit)
```
Hiện để `"1"` (iPhone-only) → không cần iPad screenshots.

### 3.4 Verify bundle sau khi build (sanity)
```bash
# Sau khi có bundle, xác nhận flag đã inline đúng
grep -o "REVENUECAT_ENABLED *= *[a-z]*" ios/build/.../main.jsbundle | head
# kỳ vọng: var REVENUECAT_ENABLED = false;
```

---

## 4. Bump version & build number (Bước 2)

iOS lấy version/build từ **3 nguồn** — phải khớp, nếu không sẽ confuse hoặc bị
ASC từ chối:

| Nơi | Key | Ghi chú |
|-----|-----|---------|
| `ios/PMPExamPro/Info.plist` | `CFBundleShortVersionString`, `CFBundleVersion` | **Authoritative** cho binary (Info.plist dùng literal, không phải `$(MARKETING_VERSION)`) |
| `ios/PMPExamPro.xcodeproj/project.pbxproj` | `MARKETING_VERSION`, `CURRENT_PROJECT_VERSION` | cả **2** build config (Debug + Release) |
| `app.json` | `version` | giữ đồng bộ |

**Luật vàng:**
- `CFBundleShortVersionString` = version người dùng thấy (vd `1.1.0`).
- `CFBundleVersion` (build number) **phải tăng mỗi lần upload** lên ASC, kể cả
  cùng một marketing version. Hiện đã upload `1.1.0 (2)` → **lần sau là build 3**.

Check:
```bash
grep -A1 "CFBundleShortVersionString\|CFBundleVersion" ios/PMPExamPro/Info.plist
grep "MARKETING_VERSION\|CURRENT_PROJECT_VERSION" ios/PMPExamPro.xcodeproj/project.pbxproj
grep '"version"' app.json
```

> ⚠️ `ios/` đang được commit (KHÔNG phải pure CNG cho release). **Tuyệt đối
> không** `expo prebuild` trước khi archive — nó regenerate native project từ
> app.json và xóa các chỉnh tay (signing, version literal, device family).

---

## 5. Chuẩn bị keychain ký (Bước 3)

Vấn đề kinh điển: codesign báo `errSecInternalComponent` khi chạy
detached/headless vì không mở được keychain chứa private key. Giải pháp **bền
vững**: dùng keychain project-local với password đã biết (đã có sẵn trong
`signing/`).

Nếu keychain đã tồn tại (trường hợp bình thường) chỉ cần unlock + đưa vào search list:
```bash
KC="$PWD/signing/pmp.keychain-db"; KCPASS="pmp-build-local"
security unlock-keychain -p "$KCPASS" "$KC"
security list-keychains -d user -s "$KC" ~/Library/Keychains/login.keychain-db
security find-identity -p codesigning "$KC"   # CHECK: phải thấy "iPhone Distribution: ... (A2856ZD38W)"
```

Nếu phải **tạo lại** keychain từ đầu (mất file), từ key+cert thô:
```bash
# dist.key (private key) + dist.pem (cert) + wwdr.pem (Apple WWDR)
openssl pkcs12 -export -inkey dist.key -in dist.pem -certfile wwdr.pem \
  -name "iPhone Distribution: Phan Thien Dao Nguyen (A2856ZD38W)" \
  -out signing/pmp-login.p12 -passout pass:pmp1234   # LibreSSL: KHÔNG dùng -legacy
KC="$PWD/signing/pmp.keychain-db"; KCPASS="pmp-build-local"
security create-keychain -p "$KCPASS" "$KC"
security set-keychain-settings -lut 21600 "$KC"
security unlock-keychain -p "$KCPASS" "$KC"
security import signing/pmp-login.p12 -k "$KC" -P pmp1234 -T /usr/bin/codesign -T /usr/bin/security
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KCPASS" "$KC"
security list-keychains -d user -s "$KC" ~/Library/Keychains/login.keychain-db
```

> ⚠️ Bảo mật: KHÔNG để private key thô (`dist.key`) trong `/tmp` (world-readable
> trên macOS). Xóa sau khi import xong.

---

## 6. Archive (Bước 4)

```bash
export SENTRY_DISABLE_AUTO_UPLOAD=true   # nếu không, phase "Bundle React Native" chết: "Auth token is required"
KC="$PWD/signing/pmp.keychain-db"

xcodebuild -workspace ios/PMPExamPro.xcworkspace -scheme PMPExamPro \
  -configuration Release -destination 'generic/platform=iOS' \
  -archivePath ios/build/PMPExamPro.xcarchive \
  CODE_SIGN_STYLE=Manual DEVELOPMENT_TEAM=A2856ZD38W \
  PROVISIONING_PROFILE_SPECIFIER="PMP App Store" \
  CODE_SIGN_IDENTITY="iPhone Distribution: Phan Thien Dao Nguyen (A2856ZD38W)" \
  OTHER_CODE_SIGN_FLAGS="--keychain $KC" \
  archive
```
Vì sao truyền signing trên CLI: project **không** bake sẵn `DEVELOPMENT_TEAM`.

Check: `ls ios/build/PMPExamPro.xcarchive` tồn tại; log không có
`errSecInternalComponent`.

---

## 7. Export IPA (Bước 5)

```bash
xcodebuild -exportArchive \
  -archivePath ios/build/PMPExamPro.xcarchive \
  -exportOptionsPlist ios/ExportOptions.plist \
  -exportPath ios/build/export
```
`ExportOptions.plist`: method `app-store-connect`, signing `manual`, team
`A2856ZD38W`, profile `PMP App Store`, `manageAppVersionAndBuildNumber=false`
(lấy version/build **đúng nguyên** từ Info.plist — không tự đổi).

Check: `ls ios/build/export/PMPExamPro.ipa`.

---

## 8. Upload binary lên ASC (Bước 6)

```bash
xcrun altool --upload-app -f ios/build/export/PMPExamPro.ipa -t ios \
  --apiKey G3CD625ZNS --apiIssuer 48d421d0-29a7-4799-97ee-4330306500d9
```
Check: log kết thúc `UPLOAD SUCCEEDED`. Build xuất hiện trong
`asc builds list` sau ~5-15 phút (xử lý phía Apple).

---

## 9. Đợi build + version record (Bước 7-8)

```bash
# Đợi build xử lý xong (state VALID)
asc builds list --app 6782658779
# hoặc dùng tiện ích chờ nếu có:
asc builds wait --app 6782658779 --build-number 2

# Tạo / đổi tên version record cho marketing version mới
asc versions list --app 6782658779
# nếu record cũ tên "1.0" mà đang upload 1.1.0 → đổi tên/ tạo "1.1.0"
```
- Build phải ở state **VALID** (không phải `PROCESSING`/`INVALID`) thì mới attach
  được.
- Phải có **một version record khớp marketing version** (vd `1.1.0`). Lần trước
  record tên `1.0` đã phải đổi thành `1.1.0`.

Attach build vào version: dùng `asc` (`asc versions ...` / `asc submit` tự gắn)
hoặc API. Check: version record hiển thị đúng build (vd `14ec7105-...`).

---

## 10. Export compliance — encryption (Bước 9)

App này **miễn trừ** mã hóa (chỉ HTTPS chuẩn) → set `usesNonExemptEncryption=false`.

> ⚠️ Cạm bẫy: **KHÔNG** tạo `appEncryptionDeclarations` cho case miễn trừ — API
> từ chối ("Cannot create appEncryptionDeclarations unless either
> containsProprietaryCryptography is True..."). Case miễn trừ phải set thuộc
> tính **trên build**.

Đường đã chạy (REST API thô, deterministic):
```bash
python3 - <<'PY'
import jwt, time, requests
from cryptography.hazmat.primitives.serialization import load_pem_private_key
KID="G3CD625ZNS"; ISS="48d421d0-29a7-4799-97ee-4330306500d9"
key=open("/Users/<you>/.appstoreconnect/private_keys/AuthKey_G3CD625ZNS.p8","rb").read()
tok=jwt.encode({"iss":ISS,"iat":int(time.time()),"exp":int(time.time())+1200,"aud":"appstoreconnect-v1"},
               key, algorithm="ES256", headers={"kid":KID})
BUILD="<build-id>"
r=requests.patch(f"https://api.appstoreconnect.apple.com/v1/builds/{BUILD}",
  headers={"Authorization":f"Bearer {tok}","Content-Type":"application/json"},
  json={"data":{"type":"builds","id":BUILD,"attributes":{"usesNonExemptEncryption":False}}})
print(r.status_code, r.text[:300])
PY
```

Đường gọn hơn cho lần sau (asc 0.44+ đã có lệnh — verify trước khi tin):
```bash
asc encryption --help        # xem subcommand quản lý encryption declaration
```

**Cách bền nhất:** bake luôn vào `Info.plist` để khỏi PATCH mỗi build:
```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```
(đang là follow-up chưa làm — xem TODO.md.)

---

## 11. Content rights (Bước 10)

```bash
asc apps update --id 6782658779 --content-rights DOES_NOT_USE_THIRD_PARTY_CONTENT
```
(App tự sản xuất nội dung, không dùng content bên thứ 3.)

---

## 12. Screenshots — idempotent (Bước 11)

> 🔴 **Bài học đau**: `fastlane deliver` upload **mỗi ảnh 2 lần** trong cùng 1
> run (10 thay vì 5) vì nó parallel-upload rồi chạy verify/retry loop, mà ASC
> **không dedup phía server**. `overwrite_screenshots: true` KHÔNG cứu được
> (nó chỉ xóa ảnh có sẵn ở đầu run). → **Không dùng `deliver` cho iOS.**

Quy tắc: upload qua **ASC API idempotent** — clear set → upload mỗi ảnh đúng 1
lần → **assert đếm == N**.

```bash
# Cách gọn (kiểm tra subcommand thực tế):
asc screenshots --help
# Hoặc API thô: lấy set theo display type APP_IPHONE_67, xóa sạch, upload, đếm lại.
```
Endpoints (API thô):
- `GET /v1/appStoreVersionLocalizations/{id}/appScreenshotSets`
- `GET /v1/appScreenshotSets/{id}/appScreenshots`
- `DELETE /v1/appScreenshots/{id}` (xóa dup)

Check **bắt buộc**: sau upload, đếm số ảnh trong set = số kỳ vọng (vd 5).
- iPhone 6.7": display type `APP_IPHONE_67`, ảnh 1320×2868.
- Free build **không có** ảnh paywall (06) → giữ ở
  `fastlane/ios/_screenshots_excluded/`, chỉ upload 01-05.

---

## 13. App Privacy (Bước 12)

> ⚠️ **Không có public API** cho App Privacy / data-usage (cả `asc` API key lẫn
> Fastlane API-key đều không ghi được — endpoint `appDataUsages` trả 404). Chỉ
> set được qua **Apple ID web session** (cần 2FA).

Khai báo đúng cho app này (Clerk sign-in; Sentry DSN trống; RevenueCat off; không analytics):
| Data type | Purpose | Linked? | Tracking? |
|-----------|---------|---------|-----------|
| Email Address | App Functionality | Yes | No |
| Name | App Functionality | Yes | No |
| User ID | App Functionality | Yes | No |

Cách đã chạy: Fastlane (cần Apple ID + 2FA, **không** dùng API key được):
```bash
fastlane upload_app_privacy_details_to_app_store   # dùng fastlane/app_privacy_details.json
```
- ⚠️ Session spaceship cache hết hạn → kẹt ở prompt 2FA "Ambiguous choice".
  Chạy `fastlane spaceauth -u <apple-id>` trước để nạp session, hoặc làm tay
  trên ASC web 1 lần.
- File khai báo: `fastlane/app_privacy_details.json`.

Check: ASC web → App Privacy hiển thị "Published" với đúng 3 mục.

---

## 14. Submit + monitor (Bước 13)

```bash
# Verify readiness trước (liệt kê blocker còn thiếu)
asc validate --app 6782658779

# Submit
asc submit create --app 6782658779 --version 1.1.0 --build <build-id> --confirm

# Theo dõi
asc status --app 6782658779            # dashboard: appstore.state / review.state
asc reviews history --app 6782658779   # lịch sử review
```

Luồng state:
```
WAITING_FOR_REVIEW → IN_REVIEW → PENDING_DEVELOPER_RELEASE / READY_FOR_SALE  (thành công)
                                → REJECTED  (đọc Resolution Center, sửa, submit lại)
```
Apple review thường ~24-48h. Check kết quả ở đầu mỗi session (memory
`appstore-review-status`).

> Lưu ý: có thể còn 1 submission rỗng (READY_FOR_REVIEW, 0 items) lởn vởn —
> vô hại, nhưng đừng nhầm nó với submission thật.

---

## 15. Checklist tổng hợp (copy mỗi lần release)

```
PRE-FLIGHT
[ ] .env.production: EXPO_PUBLIC_REVENUECAT_ENABLED=false
[ ] Clerk key đúng instance (pk_live_ cho prod thật, hay pk_test_ cho test)
[ ] TARGETED_DEVICE_FAMILY đúng (1 = iPhone-only)
[ ] CFBundleVersion (build number) ĐÃ TĂNG so với lần upload trước
[ ] Version khớp ở: Info.plist + project.pbxproj (cả 2 config) + app.json
[ ] KHÔNG chạy expo prebuild

BUILD & UPLOAD
[ ] Keychain unlock + trong search list; find-identity thấy cert dist
[ ] SENTRY_DISABLE_AUTO_UPLOAD=true
[ ] archive OK (không errSecInternalComponent)
[ ] export ra .ipa
[ ] altool: UPLOAD SUCCEEDED
[ ] (verify bundle) REVENUECAT_ENABLED = false

ASC
[ ] build state VALID
[ ] version record khớp marketing version, đã attach build
[ ] usesNonExemptEncryption=false
[ ] content rights = DOES_NOT_USE_THIRD_PARTY_CONTENT
[ ] screenshots: đúng N, KHÔNG nhân đôi (đếm lại qua API)
[ ] App Privacy: Published (Email/Name/UserID → App Functionality, linked, not tracking)
[ ] metadata / keywords / age rating / demo account đã set

SUBMIT
[ ] asc validate sạch blocker
[ ] asc submit create --confirm
[ ] asc status = WAITING_FOR_REVIEW
[ ] ghi vào memory appstore-review-status để check kết quả
```

---

## 16. Troubleshooting — lỗi đã gặp & cách xử lý (reflection)

| Triệu chứng | Nguyên nhân | Cách fix |
|-------------|-------------|----------|
| Archive: *"Signing requires a development team"* | project không bake `DEVELOPMENT_TEAM` | truyền signing trên CLI (mục 6) |
| Build phase: *"Auth token is required, run sentry-cli login"* | Sentry auto-upload bật | `export SENTRY_DISABLE_AUTO_UPLOAD=true` |
| codesign `errSecInternalComponent` | keychain chứa private key bị khóa / mất pass | keychain project-local + `OTHER_CODE_SIGN_FLAGS="--keychain $KC"` (mục 5-6) |
| Tạo encryption declaration bị từ chối (both-false) | case miễn trừ không được tạo declaration | set `usesNonExemptEncryption=false` trên **build** (mục 10) |
| Submit fail: thiếu content rights | chưa khai content rights | `asc apps update --content-rights ...` |
| Submit fail: thiếu iPad screenshots | device family = "1,2" | đổi `TARGETED_DEVICE_FAMILY="1"` + rebuild (build++), hoặc làm iPad screenshots |
| Submit fail: App Privacy chưa khai | chưa publish privacy | làm qua Fastlane/ASC web (mục 13) |
| Screenshots nhân đôi (10 thay vì 5) | `fastlane deliver` re-upload, ASC không dedup | xóa dup qua `DELETE /v1/appScreenshots/{id}`; chuyển sang API idempotent |
| Fastlane privacy kẹt prompt 2FA "Ambiguous choice" | session spaceship hết hạn | `fastlane spaceauth -u <apple-id>` trước, hoặc làm web tay |

---

## 17. Bài học / nguyên tắc (để lần sau nhanh & ít lỗi)

1. **`asc validate` trước khi submit.** Liệt kê hết blocker 1 lần thay vì
   submit → fail → sửa → submit lặp lại.
2. **Tăng build number trước mọi thứ.** Quên là phải build lại từ đầu.
3. **iOS → `asc` + REST API; Android → Fastlane `supply`.** Không dùng
   `fastlane deliver` cho iOS (xem `ios-release-tooling.md`).
4. **Screenshots phải idempotent + assert count.** Bắt dup trong workflow,
   đừng để phát hiện trên ASC UI.
5. **Không `expo prebuild` trước release** — sẽ mất chỉnh tay native.
6. **Pre-flight config xong mới build** — env inline tĩnh, sai là rebuild.
7. **Giữ secret ngoài git** — `signing/`, `.p8`, `.p12`, key thô không vào repo;
   xóa key thô khỏi `/tmp`.
8. **Các thao tác one-time nên bake vĩnh viễn**: `ITSAppUsesNonExemptEncryption`
   vào Info.plist để khỏi PATCH encryption mỗi lần.

---

## 18. Tham chiếu

- Quyết định tooling + root-cause screenshot dup: [`ios-release-tooling.md`](./ios-release-tooling.md)
- Recipe build/sign chi tiết + gotcha: memory `ios-release-build`
- Trạng thái review hiện tại: memory `appstore-review-status`, `TODO.md`
- ASC API auth (JWT): ES256, key `~/.appstoreconnect/private_keys/AuthKey_G3CD625ZNS.p8`,
  kid `G3CD625ZNS`, iss `48d421d0-29a7-4799-97ee-4330306500d9`, aud `appstoreconnect-v1`
- File khai báo privacy: `fastlane/app_privacy_details.json`
- ExportOptions: `ios/ExportOptions.plist`

> Follow-up chưa làm (TODO.md): bake `ITSAppUsesNonExemptEncryption=false`;
> fix accessibility-label onboarding; xóa key thô ở `/tmp/pmp-signing/`;
> (tùy chọn) làm lại screenshot 06 cho free build.
