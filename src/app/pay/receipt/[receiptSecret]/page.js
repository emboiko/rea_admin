import { ReceiptPage } from '@/components/account/ReceiptPage';

const Page = async ({ params }) => {
  const resolvedParams = await params;
  return <ReceiptPage receiptSecret={resolvedParams.receiptSecret} />;
};

export default Page;
