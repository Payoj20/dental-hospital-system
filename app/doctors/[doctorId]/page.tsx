import Availability from "./Availability";

type DoctorAvailabilityPageProps = {
  params: Promise<{ doctorId: string }>;
};

const DoctorAvailabilityPage = async ({
  params,
}: DoctorAvailabilityPageProps) => {
  const { doctorId } = await params;

  return (
    <div className="max-w-7xl mx-auto px-4 py-32">
      <h1 className="text-3xl font-semibold mb-8">
        Doctor Availability
      </h1>

      <Availability doctorId={doctorId} />
    </div>
  );
};

export default DoctorAvailabilityPage;
