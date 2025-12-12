import { motion } from 'framer-motion';
import { User, Building2, Mail, Package, LogOut, Phone, Users, ChevronRight, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TabBar from '@/components/TabBar';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { baseurl } from '@/Api/Baseurl';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical, KeyRound } from "lucide-react";


const Profile = () => {
  const { user, logout, orders, setUser } = useApp();
  const navigate = useNavigate();

  const [freshUser, setFreshUser] = useState(user); // Updated user from API
  const [staffDetails, setStaffDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  // =====================================================
  // ✨ Fetch Updated User Info (Fix for stale context)
  // =====================================================
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user?.id) return;

      try {
        console.log("🔄 Fetching updated user info from API:", `${baseurl}/accounts/${user.id}`);

        const response = await fetch(`${baseurl}/accounts/${user.id}`);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Updated user data:", data);

        setFreshUser(data);
        setUser(data); // Update global context also
      } catch (err) {
        console.error("❌ Error fetching user info:", err);
        toast.error("Failed to load profile details");
      }
    };

    fetchUserInfo();
  }, [user?.id, setUser]);

  // =====================================================
  // Fetch Staff Details
  // =====================================================
  useEffect(() => {
    const fetchStaffDetails = async () => {
      if (!freshUser?.staffid) return;

      try {
        setLoading(true);
        console.log("📞 Fetching staff details:", `${baseurl}/accounts/${freshUser.staffid}`);

        const response = await fetch(`${baseurl}/accounts/${freshUser.staffid}`);

        if (!response.ok) {
          throw new Error("Staff fetch failed");
        }

        const data = await response.json();
        setStaffDetails(data);
      } catch (error) {
        console.error("❌ Error fetching staff details:", error);
        toast.error("Could not load staff information");
      } finally {
        setLoading(false);
      }
    };

    fetchStaffDetails();
  }, [freshUser?.staffid]);


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      icon: Package,
      label: 'My Orders',
      value: orders.length,
      onClick: () => navigate('/orders'),
      gradient: 'from-blue-500 to-indigo-500',
    },
    {
      icon: Warehouse,
      label: 'Inventory',
      value: 0,
      onClick: () => navigate('/inventory'),
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
  <div className="max-w-md mx-auto p-4 flex items-center justify-between">
    
    {/* Left Text */}
    <div>
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="text-sm text-muted-foreground">Manage your account</p>
    </div>

    {/* Right Dropdown Menu */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 rounded-full hover:bg-muted transition">
          <EllipsisVertical className="h-6 w-6" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Account Options</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => navigate("/edit-profile")}>
          <User className="mr-2 h-4 w-4" />
          Edit Profile
        </DropdownMenuItem>

     <DropdownMenuItem
  onClick={() =>
    navigate("/reset-password", {
      state: { email: freshUser?.email }
    })
  }
>
  <KeyRound className="mr-2 h-4 w-4" />
  Reset Password
</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</header>


      {/* Main */}
      <main className="max-w-md mx-auto p-4 space-y-6">

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-3xl p-6 border border-border"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {freshUser?.name?.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{freshUser?.name}</h2>
              <p className="text-muted-foreground">{freshUser?.business_name}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{freshUser?.email}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{freshUser?.business_name}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{freshUser?.mobile_number}</span>
            </div>
          </div>
        </motion.div>

       

        {/* Staff Details Card */}
        {freshUser?.staffid && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl p-6 border border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">Your Support Contact</h3>
            </div>

            <div className="space-y-3">

              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="font-medium">Staff Name</p>
                  <p className="text-muted-foreground">
                    {loading ? "Loading..." : staffDetails?.name || "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">
                    {loading ? "Loading..." : staffDetails?.email || "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="font-medium">Mobile</p>
                  <p className="text-muted-foreground">
                    {loading ? "Loading..." : staffDetails?.mobile_number || "Not available"}
                  </p>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* Menu Items */}
        <div className="space-y-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.98 }}
                onClick={item.onClick}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="w-full bg-card rounded-2xl p-5 shadow-lg border border-border hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">{item.label}</p>
                    {item.value > 0 && (
                      <p className="text-xs text-muted-foreground">{item.value} items</p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </motion.button>
            );
          })}
        </div>


        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="destructive"
          size="lg"
          className="w-full mt-4"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Logout
        </Button>

      </main>

      <TabBar />
    </div>
  );
};

export default Profile;
