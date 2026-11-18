import { HouseholdPage } from '@/components/board/HouseholdPage';

const Page = async ({ params }) => {
  const resolvedParams = await params;
  return <HouseholdPage householdId={resolvedParams.householdId} />;
};

export default Page;
