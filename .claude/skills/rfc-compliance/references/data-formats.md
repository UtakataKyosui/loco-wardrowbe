# データ形式（JSON / 日時 / UUID / メール / URI）

## JSON（RFC 8259）

- **UTF-8**（§8.1）。閉じたシステム以外では UTF-8 でなければならない（MUST）。BOM を付けない。
- 媒体型は `application/json`。`charset` パラメーターは定義されていない（付けない）。
- **数値の相互運用性**（§6）: JavaScript の数値は IEEE 754 倍精度で、整数は 2^53 − 1（`9007199254740991`）まで正確。これを超えうる ID・カウンターは文字列で返す。このアプリは外部に出す ID を UUID の文字列（`pid`）にしていて、DB の連番（`id`）は出していない。これを保つ。
- 同じ名前のキーを 1 つのオブジェクトに複数置かない（§4 の SHOULD）。
- `null` と「キーなし」を区別する。`Option<T>` を `null` で出すのか、キーごと省くのか（`#[serde(skip_serializing_if = "Option::is_none")]`）を 1 つに決め、OpenAPI（`nullable` / 必須でない）と揃える。
- 本文のない成功は `204`（`null` を本文にした `200` を返さない）。

## 日時（RFC 3339）

- 形式は `2026-11-17T01:19:03Z` または `2026-11-17T10:19:03+09:00`。区切りは `T`、小数秒は任意、**オフセット（`Z` または `±hh:mm`）が必須**（§5.6 の `date-time`）。
- Rust は `chrono::DateTime<Utc>` または `DateTime<FixedOffset>`（SeaORM の `DateTimeWithTimeZone`）を API の型にする。serde の既定の出力が RFC 3339 になる。
- **`NaiveDateTime` をそのまま API に出さない**。オフセットがなく、RFC 3339 の `date-time` ではない。DB の `timestamp`（タイムゾーンなし）列も同様。`timestamptz` を使う。
- アプリ内部で `Local::now()` と `timestamptz` を比べるのは問題ないが、**サーバーのタイムゾーンに依存する出力**を API に出さない。
- 期間は ISO 8601 の `duration`（RFC 3339 付録 A）。秒数を返すなら、フィールド名に単位を入れる（`expires_in_seconds`）。
- OpenAPI は `type: string, format: date-time`。utoipa の `chrono` 機能が `DateTime` 系にこれを付ける。生成された `openapi/openapi.yaml` で確かめる。

## UUID（RFC 9562）

- テキスト形式は小文字の 16 進で `8-4-4-4-12`（例: `550e8400-e29b-41d4-a716-446655440000`）。出力は小文字、入力は大文字小文字を区別せず受ける。`uuid::Uuid` の `Display` / `Serialize` はこの形で出す。
- ユーザーの識別子 `pid` は UUID。レスポンス型の `pid`（`views/auth.rs`）は `uuid::Uuid` で、OpenAPI に `format: uuid` が出る。生成された Zod は `z.uuid()` になり、不正な値を実行時に弾ける。`String` で持つと `format` が出ない。
- 新しい識別子は UUID v4（乱数）か v7（時刻順。DB の索引に有利）。RFC 4122 の番号は新しいコードに書かない（RFC 9562 が置き換えた）。
- 推測できる連番の ID を URL に出さない（列挙攻撃の足がかりになる）。

## メールアドレス（RFC 5321 / 5322）

- **正規表現で検証しない**。`validator` の `#[validate(email)]` を使う（`models/users.rs` の `RegisterParams` が使っている）。`validator` の `email` は WHATWG（HTML）の実用的な部分集合で、RFC 5322 の全構文（コメント、引用符つきローカル部など）は受け付けない。実用上はこれで足りる。引用符つきなどの特殊な形式を受けるなら別の検証が必要になる。
- 長さ: ローカル部は 64 オクテット以内（RFC 5321 §4.5.3.1.1）、パスは山括弧を含めて 256 オクテット以内（§4.5.3.1.3）。山括弧を除いた実用上の上限は 254 文字。
- **大文字小文字**: ドメイン部は DNS の規則で区別しない（RFC 5321 §2.4、RFC 4343）。ローカル部は理論上区別されるが、それに頼るのは非推奨（同 §2.4）。**実務では全体を小文字にして保存・照合する**。`find_by_email` が `eq` で照合している（大文字小文字を区別する）ので、登録・ログイン・リセットのどこでも同じ正規化（`trim()` + 小文字）を通す。
- **許可ドメインの判定**（`controllers/auth.rs` の `is_allowed_email_domain`）: 以前の正規表現（`@example\.com$|@gmail\.com$`）は大文字小文字を区別して `x@Gmail.com` を拒否していた（実測）。今は最後の `@` で分け、ドメインを `eq_ignore_ascii_case` で許可リストと比べる。許可リストを設定に出すかは未定。
- 国際化されたメールアドレス（RFC 6531）を受けるかどうかは、プロダクトの方針として決める。受けないなら、そのことを OpenAPI の説明に書く。OpenAPI の `format` は `email`（RFC 5321 §4.1.2）または `idn-email`（RFC 6531）。
- メール本文・ヘッダーは RFC 5322 / 2045 / 2047。`lettre`（Loco の mailer）に任せ、ヘッダーを文字列結合で作らない（ヘッダーインジェクションの原因になる）。

## URI（RFC 3986）

- パスは小文字・ハイフン区切り（`/api/auth/magic-link`）。末尾のスラッシュは付けない。リソースは名詞の複数形。
- パスのパラメーターは `{id}`（axum 0.8 と OpenAPI のパステンプレートで同じ書き方。RFC 6570 のレベル 1 の展開に相当）。`:id` は axum 0.7 以前の書き方。
- パーセントエンコードされた文字は axum の `Path` が復号する。自分で `%` を扱わない。
- **トークン・パスワード・個人情報を URL に載せない**（RFC 3986 §7.5）。URL はアクセスログ、ブラウザー履歴、`Referer` に残る。クエリ文字列にも同じことが言える。
- `Location` ヘッダーなどの URI は、絶対 URI か、`/` で始まる相対参照にする。

## OpenAPI の `format`（JSON Schema 2020-12 の語彙）

| 型 | `format` | 元になる RFC | Rust |
|---|---|---|---|
| 日時 | `date-time` | RFC 3339 §5.6 | `DateTime<Utc>` / `DateTimeWithTimeZone` |
| 日付 | `date` | RFC 3339 §5.6 | `NaiveDate` |
| 期間 | `duration` | RFC 3339 付録 A | `chrono::Duration`（`ToSchema` を手で書く） |
| UUID | `uuid` | RFC 9562 | `uuid::Uuid` |
| メール | `email` | RFC 5321 §4.1.2 | `String` + `#[validate(email)]` |
| URI | `uri` / `uri-reference` | RFC 3986 | `String` |

`openapi/openapi.yaml` が出す `format` が実際の値の形と一致しているかを、監査のたびに確かめる（`audit.md`）。
