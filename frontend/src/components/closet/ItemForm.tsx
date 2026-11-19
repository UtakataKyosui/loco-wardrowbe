import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { Button, Field, Input, NativeSelect, Switch, ToggleGroup } from "@utakata-ui/react";
import { Stack } from "lism-css/react";
import { MaterialIcon } from "../MaterialIcon";
import { addClosetItem } from "../../mocks/closet";
import type { Category, ClothingItem, Season } from "../../mocks/types";
import {
  CATEGORY_OPTIONS,
  SEASON_OPTIONS,
  itemFormDefaults,
  itemFormSchema,
} from "./itemFormSchema";
import type { ItemFormValues } from "./itemFormSchema";
import "./itemForm.css";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/** Schema issues arrive as objects; plain validators may return strings. */
function firstError(errors: unknown[]): string | undefined {
  for (const e of errors) {
    if (typeof e === "string") return e;
    if (typeof e === "object" && e !== null && "message" in e && typeof e.message === "string") {
      return e.message;
    }
  }
  return undefined;
}

function toClothingItem(v: ItemFormValues, imageUrl: string | undefined): ClothingItem {
  const parsed = itemFormSchema.parse(v);
  return {
    id: `c${Date.now()}`,
    brand: parsed.brand,
    name: parsed.name,
    color: parsed.color,
    category: parsed.category as Category,
    seasons: parsed.seasons as Season[],
    wearCount: 0,
    favorite: parsed.favorite,
    imageUrl,
    size: parsed.size || undefined,
    material: parsed.material || undefined,
    price: parsed.price ? Number(parsed.price) : undefined,
    purchasedAt: parsed.purchasedAt || undefined,
  };
}

export function ItemForm() {
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState<string>();
  const [photoError, setPhotoError] = useState<string>();

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const form = useForm({
    defaultValues: itemFormDefaults,
    validators: { onSubmit: itemFormSchema },
    onSubmit: ({ value }) => {
      addClosetItem(toClothingItem(value, photoUrl));
      // The new item owns the object URL now; skip the cleanup revoke.
      setPhotoUrl(undefined);
      void navigate({ to: "/closet" });
    },
  });

  const onPhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("画像ファイルを選択してください。");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("10MB以下の画像を選択してください。");
      return;
    }
    setPhotoError(undefined);
    setPhotoUrl(URL.createObjectURL(file));
  };

  return (
    <form
      className="c--itemForm"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <Stack g="20">
        <Field.Root name="photo" invalid={Boolean(photoError)}>
          <Field.Label>写真</Field.Label>
          <div className="c--itemFormPhoto">
            {photoUrl ? (
              <img src={photoUrl} alt="選択した写真のプレビュー" />
            ) : (
              <span className="c--itemFormPhotoEmpty">
                <MaterialIcon name="add_a_photo" size={28} />
                未選択
              </span>
            )}
          </div>
          <Input type="file" accept="image/*" onChange={onPhotoChange} />
          <Field.Description>任意。10MB以下の画像。</Field.Description>
          {photoError && <Field.Error>{photoError}</Field.Error>}
        </Field.Root>

        <form.Field name="brand">
          {(field) => {
            const error = firstError(field.state.meta.errors);
            return (
              <Field.Root name={field.name} invalid={field.state.meta.isTouched && Boolean(error)}>
                <Field.Label>ブランド</Field.Label>
                <Input
                  required
                  autoComplete="off"
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
                {error && <Field.Error>{error}</Field.Error>}
              </Field.Root>
            );
          }}
        </form.Field>

        <form.Field name="name">
          {(field) => {
            const error = firstError(field.state.meta.errors);
            return (
              <Field.Root name={field.name} invalid={field.state.meta.isTouched && Boolean(error)}>
                <Field.Label>アイテム名</Field.Label>
                <Input
                  required
                  autoComplete="off"
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
                {error && <Field.Error>{error}</Field.Error>}
              </Field.Root>
            );
          }}
        </form.Field>

        <form.Field name="category">
          {(field) => {
            const error = firstError(field.state.meta.errors);
            return (
              <Field.Root name={field.name} invalid={field.state.meta.isTouched && Boolean(error)}>
                <Field.Label>カテゴリ</Field.Label>
                <NativeSelect
                  required
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value as Category)}
                  onBlur={field.handleBlur}
                >
                  {CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </NativeSelect>
                {error && <Field.Error>{error}</Field.Error>}
              </Field.Root>
            );
          }}
        </form.Field>

        <form.Field name="color">
          {(field) => {
            const error = firstError(field.state.meta.errors);
            return (
              <Field.Root name={field.name} invalid={field.state.meta.isTouched && Boolean(error)}>
                <Field.Label>カラー</Field.Label>
                <Input
                  required
                  autoComplete="off"
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
                {error && <Field.Error>{error}</Field.Error>}
              </Field.Root>
            );
          }}
        </form.Field>

        <form.Field name="seasons">
          {(field) => {
            const error = firstError(field.state.meta.errors);
            return (
              <Field.Root name={field.name} invalid={field.state.meta.isTouched && Boolean(error)}>
                <span id="itemFormSeasonsLabel" className="ui-field__label">
                  季節（複数選択可）
                </span>
                <ToggleGroup.Root
                  multiple
                  aria-labelledby="itemFormSeasonsLabel"
                  value={field.state.value}
                  onValueChange={(v) => {
                    field.handleChange(v as Season[]);
                    field.handleBlur();
                  }}
                >
                  {SEASON_OPTIONS.map((o) => (
                    <ToggleGroup.Item
                      key={o.value}
                      value={o.value}
                      variant="outline"
                      className="c--itemFormSeason"
                    >
                      {o.label}
                    </ToggleGroup.Item>
                  ))}
                </ToggleGroup.Root>
                {error && <Field.Error>{error}</Field.Error>}
              </Field.Root>
            );
          }}
        </form.Field>

        <form.Field name="size">
          {(field) => {
            const error = firstError(field.state.meta.errors);
            return (
              <Field.Root name={field.name} invalid={field.state.meta.isTouched && Boolean(error)}>
                <Field.Label>サイズ</Field.Label>
                <Input
                  autoComplete="off"
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
                <Field.Description>任意。例: M、27.5cm</Field.Description>
                {error && <Field.Error>{error}</Field.Error>}
              </Field.Root>
            );
          }}
        </form.Field>

        <form.Field name="material">
          {(field) => {
            const error = firstError(field.state.meta.errors);
            return (
              <Field.Root name={field.name} invalid={field.state.meta.isTouched && Boolean(error)}>
                <Field.Label>素材</Field.Label>
                <Input
                  autoComplete="off"
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
                <Field.Description>任意。例: カシミヤ100%</Field.Description>
                {error && <Field.Error>{error}</Field.Error>}
              </Field.Root>
            );
          }}
        </form.Field>

        <form.Field name="price">
          {(field) => {
            const error = firstError(field.state.meta.errors);
            return (
              <Field.Root name={field.name} invalid={field.state.meta.isTouched && Boolean(error)}>
                <Field.Label>購入価格（円）</Field.Label>
                <Input
                  inputMode="numeric"
                  autoComplete="off"
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
                <Field.Description>任意。半角数字のみ。</Field.Description>
                {error && <Field.Error>{error}</Field.Error>}
              </Field.Root>
            );
          }}
        </form.Field>

        <form.Field name="purchasedAt">
          {(field) => {
            const error = firstError(field.state.meta.errors);
            return (
              <Field.Root name={field.name} invalid={field.state.meta.isTouched && Boolean(error)}>
                <Field.Label>購入日</Field.Label>
                <Input
                  type="date"
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
                <Field.Description>任意。</Field.Description>
                {error && <Field.Error>{error}</Field.Error>}
              </Field.Root>
            );
          }}
        </form.Field>

        <form.Field name="favorite">
          {(field) => (
            <Field.Root name={field.name}>
              <div className="c--itemFormSwitch">
                <Switch.Root checked={field.state.value} onCheckedChange={field.handleChange}>
                  <Switch.Thumb />
                </Switch.Root>
                <Field.Label>お気に入りに追加</Field.Label>
              </div>
            </Field.Root>
          )}
        </form.Field>

        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button
              type="submit"
              variant="solid"
              size="lg"
              w="100%"
              disabled={isSubmitting}
              focusableWhenDisabled
              aria-busy={isSubmitting || undefined}
            >
              {isSubmitting ? "追加中…" : "アイテムを追加"}
            </Button>
          )}
        </form.Subscribe>
      </Stack>
    </form>
  );
}
