import { useAuth } from "@/lib/context/authContext";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";
import { Button } from "./ui/button";
import Image from "next/image";

const UserProfilePopover = () => {
  const { user, profile, signOutFn } = useAuth();

  if (!user || !profile) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10">
          {user.photoURL ? (
            <Image
              src={user.photoURL}
              width={28}
              height={28}
              alt="profile-image"
              className="rounded-full border"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          )}
          {profile.fullName}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 space-y-3">
        <div className="space-y-1">
          <p className="font-semibold">{profile.fullName}</p>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>

        <div className="text-sm space-y-1">
          {profile.DOB && (
            <p>
              <span className="font-medium text-blue-600">DOB:</span>{" "}
              {format(new Date(profile.DOB), "dd MMM yyyy")}
            </p>
          )}

          {profile.phoneNumber && (
            <p>
              <span className="font-medium text-blue-600">Phone:</span>{" "}
              {profile.phoneNumber}
            </p>
          )}

          {profile.address && (
            <p>
              <span className="font-medium text-blue-600">Address:</span>{" "}
              {profile.address}
            </p>
          )}
        </div>

        <Button
          className="w-full border border-red-500/30 bg-black mt-5 text-red-500 hover:bg-red-500 hover:text-white"
          onClick={signOutFn}
        >
          Logout
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default UserProfilePopover;
