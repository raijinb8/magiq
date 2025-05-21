-- スタッフが1週間単位で申請するシフト情報を保存するテーブル
CREATE TABLE public.shifts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid DEFAULT gen_random_uuid() NOT NULL, -- 画像ではデフォルトがありましたが、通常は申請者IDとして必須かつ外部キーになることが多いです。ここではNOT NULLのみ指定。
    date DATE NOT NULL, -- シフトの開始日 (週の初日など) や申請日など、文脈に応じて。画像では単に'date'なので必須と解釈。
    shift_type TEXT, -- シフトの種類 (例: '早番', '遅番', '休日希望')、NULL許可
    custom_end_time TEXT, -- カスタム終了時間 (例: '17:00' のようなテキスト形式か、あるいはTIME型も検討可)、NULL許可
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL, -- レコード作成日時
    note TEXT -- 備考、NULL許可
);

COMMENT ON TABLE public.shifts IS 'スタッフが1週間単位で申請するシフト情報を保存するテーブル';
COMMENT ON COLUMN public.shifts.id IS 'シフト申請の一意な識別子';
COMMENT ON COLUMN public.shifts.user_id IS 'シフトを申請したユーザーのID (auth.usersテーブルのidを参照想定)';
COMMENT ON COLUMN public.shifts.date IS 'シフト申請の対象となる日付 (例: 週の開始日)';
COMMENT ON COLUMN public.shifts.shift_type IS 'シフトの種類 (例: 早番, 遅番, 通し, 休日希望など)';
COMMENT ON COLUMN public.shifts.custom_end_time IS 'カスタムの終了時間 (固定シフトでない場合など)';
COMMENT ON COLUMN public.shifts.created_at IS 'レコード作成日時';
COMMENT ON COLUMN public.shifts.note IS '申請に関する備考';

-- user_id を auth.users テーブルの id に関連付ける外部キー制約 (推奨)
-- (もし auth.users テーブルが存在し、user_id がそれを参照する場合)
-- ALTER TABLE public.shifts
-- ADD CONSTRAINT fk_shifts_user_id
-- FOREIGN KEY (user_id) REFERENCES auth.users (id)
-- ON DELETE CASCADE; -- ユーザーが削除されたら、関連するシフト申請も削除する (または SET NULL など他の挙動も検討可)

-- 効率的なクエリのためのインデックス作成 (任意ですが推奨)
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON public.shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON public.shifts(date);