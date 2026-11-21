import { useEffect } from "react";
import { useClerk } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Alert, Avatar, Button, Skeleton } from "@utakata-ui/react";
import { Effect } from "effect";
import { Heading, Stack } from "lism-css/react";
import { current } from "../api/generated/auth/auth";
import { HttpError, callApi } from "../api/effect";
import { useLogout } from "../auth/useLogout";
import { MaterialIcon } from "../components/MaterialIcon";
import "../components/account/account.css";

export function Account() {
  const navigate = useNavigate();
  const handleLogout = useLogout();
  const { openUserProfile } = useClerk();

  const profile = useQuery({
    queryKey: ["auth", "current"],
    queryFn: () => Effect.runPromise(callApi(() => current())),
    retry: false,
  });

  // The session is gone or was refused; send the user to sign in again.
  useEffect(() => {
    const err = profile.error;
    if (err instanceof HttpError && err.status === 401) {
      void navigate({ to: "/login", replace: true });
    }
  }, [profile.error, navigate]);

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
              <dd>{profile.data.email ?? "—"}</dd>
            </dl>
          </>
        )}
      </section>

      <section className="c--accountCard" aria-labelledby="account-manage">
        <h2 id="account-manage" className="c--accountHead">
          アカウントの管理
        </h2>
        <p className="c--accountText">
          メールアドレス、パスワード、ログイン中の端末は Clerk の画面で変更できます。
        </p>
        <Button
          type="button"
          variant="outline"
          size="lg"
          w="100%"
          onClick={() => openUserProfile()}
        >
          アカウントを管理する
        </Button>
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
