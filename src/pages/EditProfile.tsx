import { useState, ChangeEvent, FormEvent } from "react";
import { useApp } from "@/contexts/AppContext";
import { baseurl } from "@/Api/Baseurl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import TabBar from "@/components/TabBar";

interface EditForm {
  name: string;
  email: string;
  mobile_number: string;
}

const EditProfile = () => {
  const { user, setUser } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState<EditForm>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    mobile_number: user?.mobile_number ?? "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error("User not logged in!");
      return;
    }

    console.log("➡️ Sending update request to backend:", {
      url: `${baseurl}/update-retailer-info/${user.id}`,
      payload: form,
    });

    try {
      const res = await fetch(`${baseurl}/update-retailer-info/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      console.log("⬅️ Backend response:", data);

      if (!res.ok) {
        console.error("❌ Update failed:", data);
        toast.error(data.error || "Update failed");
        return;
      }

      toast.success("Profile updated!");

      // Update global context
      if (setUser) {
        console.log("🔄 Updating user context", { before: user, after: { ...user, ...form } });
        setUser({ ...user, ...form });
      }

      navigate("/profile");
    } catch (err) {
      console.error("🔥 Error while updating:", err);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm mb-2"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <Card className="p-2 shadow-md">
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <Input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Name"
            />

            <Input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
            />

            <Input
              name="mobile_number"
              value={form.mobile_number}
              onChange={handleChange}
              placeholder="Phone Number"
            />
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full">
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>

      <TabBar />
    </div>
  );
};

export default EditProfile;
