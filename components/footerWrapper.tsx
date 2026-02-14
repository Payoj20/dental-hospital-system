"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import Footer from "./footer";

const FooterWrapper = ({ children }: { children: ReactNode }) => {
  const pathName = usePathname();
  const hidefooter = ["/login", "/signup"].includes(pathName);
  return (
    <>
      <main>{children}</main>
      {!hidefooter && <Footer />}
    </>
  );
};

export default FooterWrapper;
