import React from "react";
import { Search } from "lucide-react";
import { SiteIcon } from "@/components/svg";
import Link from "next/link";
const horizontalHeader = ({ handleOpenSearch }) => {

  return (
    <div className="flex items-center lg:gap-12 gap-3 ">
      <div>
        <Link
          href={"/dashboard"}
          className=" text-primary flex items-center gap-2"
        >
          <SiteIcon className=" h-7 w-7" />
          <span className=" text-xl font-semibold lg:inline-block uppercase">
            HELLO <span className="text-black dark:text-white">WEBSITE</span>
          </span>
        </Link>
      </div>
    </div>
  );
};

export default horizontalHeader;