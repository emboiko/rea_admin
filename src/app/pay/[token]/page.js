import { StatementPage } from '@/components/pay/StatementPage';

const Page = async ({ params }) => {
  const resolvedParams = await params;
  return <StatementPage payToken={resolvedParams.token} />;
};

export default Page;
