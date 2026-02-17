import React from "react";
import { Search } from "lucide-react";
import { SiteLogo } from "@/components/svg";
import Link from "next/link";
const horizontalHeader = ({ handleOpenSearch }) => {

  return (
    <div className="flex items-center lg:gap-12 gap-3 ">
      <div>
        <Link
          href={"/projects"}
          className=" text-primary flex items-center gap-2"
        >
          <span className=" text-xl font-semibold lg:inline-block hidden uppercase">
            PROFIWEB
          </span>
        </Link>
      </div>
    </div>
  );
};

export default horizontalHeader;