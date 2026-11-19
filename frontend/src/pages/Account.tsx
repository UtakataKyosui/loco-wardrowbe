import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Alert, Avatar, Button, Skeleton, Spinner } from "@utakata-ui/react";
import { Effect } from "effect";
import { Heading, Stack } from "lism-css/react";
import { current, forgot } from "../api/generated/auth/auth";
import { HttpError, callApi } from "../api/effect";
import { useLogout } from "../auth/useLogout";
import { MaterialIcon } from "../components/MaterialIcon";
import "../components/account/account.css";

type Notice = { kind: "success" | "error"; message: string };

export function Account() {
  const navigate = useNavigate();
  const handleLogout = useLogout();
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const profile = useQuery({
    queryKey: ["auth", "current"],
    queryFn: () => Effect.runPromise(callApi(() => current())),
    retry: false,
  });

  // customFetch already dropped the token on 401; send the user to sign in again.
  useEffect(() => {
    const err = profile.error;
    if (err instanceof HttpError && err.status === 401) {
      void navigate({ to: "/login", replace: true });
    }
  }, [profile.error, navigate]);

  const sendResetMail = async () => {
    if (!profile.data) return;
    setNotice(null);
    setIsSending(true);
    try {
      const res = await forgot({ email: profile.data.email });
      setNotice(
        res.status === 200
          ? { kind: "success", message: "パスワード再設定のメールを送信しました。" }
          : {
              kind: "error",
              message: "メールを送信できませんでした。時間をおいて再試行してください。",
            },
      );
    } catch {
      setNotice({ kind: "error", message: "サーバーに接続できませんでした。" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Stack g="20">
      <Heading level="1" ff="accent" fz="2xl" fw="500">
        アカウント設定
      </Heading>

      <section className="c--accountCard" aria-labelledby="account-profile">
        <h2 id="account-profile" className="c--accountHead">
          プロフィール
        </h2>
        {profile.isPending && (
          <div role="status" aria-busy="true">
            <Skeleton style={{ height: 44 }} />
            <span className="u-visually-hidden">読み込み中</span>
          </div>
        )}
        {profile.isError && (
          <Alert.Root variant="destructive" role="alert">
            <Alert.Description>
              プロフィールを取得できませんでした。
              <Button type="button" variant="link" onClick={() => void profile.refetch()}>
                再読み込み
              </Button>
            </Alert.Description>
          </Alert.Root>
        )}
        {profile.data && (
          <>
            <div className="c--accountProfile">
              <Avatar.Root size="lg" role="img" aria-label="プロフィール画像">
                <Avatar.Fallback aria-hidden="true">
                  <MaterialIcon name="person" size={24} />
                </Avatar.Fallback>
              </Avatar.Root>
              <dl className="c--accountRow">
                <dt>お名前</dt>
                <dd>{profile.data.name}</dd>
              </dl>
            </div>
            <dl className="c--accountRow">
              <dt>メールアドレス</dt>
              <dd>{profile.data.email}</dd>
            </dl>
          </>
        )}
      </section>

      <section className="c--accountCard" aria-labelledby="account-password">
        <h2 id="account-password" className="c--accountHead">
          パスワード
        </h2>
        <p className="c--accountText">
          登録済みのメールアドレスに、パスワード再設定用のリンクを送ります。
        </p>
        <Button
          type="button"
          variant="outline"
          size="lg"
          w="100%"
          disabled={isSending || !profile.data}
          focusableWhenDisabled
          aria-busy={isSending || undefined}
          onClick={() => void sendResetMail()}
        >
          {isSending && <Spinner size="sm" decorative />}
          {isSending ? "送信中…" : "再設定メールを送る"}
        </Button>
        <div role="status">
          {notice && (
            <Alert.Root variant={notice.kind === "error" ? "destructive" : "default"}>
              <Alert.Description>{notice.message}</Alert.Description>
            </Alert.Root>
          )}
        </div>
      </section>

      <section className="c--accountCard" aria-labelledby="account-session">
        <h2 id="account-session" className="c--accountHead">
          セッション
        </h2>
        <Button type="button" variant="outline" size="lg" w="100%" onClick={handleLogout}>
          <MaterialIcon name="logout" size={18} />
          ログアウト
        </Button>
      </section>
    </Stack>
  );
}
