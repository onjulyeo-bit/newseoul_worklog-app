// QR 체크인 페이지 (서버) — params·searchParams는 Next 16에서 await 필요.
import CheckinClient from "./CheckinClient";

export const metadata = {
  title: "출석 체크인 · 새서울 CBMC",
  description: "이름을 눌러 출석하세요.",
  openGraph: { title: "출석 체크인 · 새서울 CBMC", description: "이름을 눌러 출석하세요." },
  robots: { index: false },
};

export default async function CheckinPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  return <CheckinClient meetingId={id} token={t ?? ""} />;
}
