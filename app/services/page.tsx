import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { services } from "@/lib/data";
import Image from "next/image";

const Services = () => {
  return (
    <div className="bg-background">
      <section className="relative overflow-hidden py-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Services available.
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From preventive dentistry to advanced treatments, we provide
              reliable and patient-focused dental services tailored to your
              needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((services, index) => (
              <Card
                key={index}
                className="border-blue-900/20 hover:border-blue-800/40 transition-all duration-300"
              >
                <CardHeader className="pb-2">
                  <Image
                    src={services.image}
                    alt={services.title}
                    width={400}
                    height={250}
                    className="object-cover"
                  />
                  <CardTitle className="text-xl font-semibold text-white">
                    {services.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {services.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
