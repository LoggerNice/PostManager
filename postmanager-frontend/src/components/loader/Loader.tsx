import { LoaderIcon } from "lucide-react";

export default function Loader() {
    return (
        <div className="flex justify-center items-center">
            <LoaderIcon className="w-5 h-5 animate-spin text-white"/>
        </div>
    );
}