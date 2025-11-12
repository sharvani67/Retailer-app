import { motion } from 'framer-motion';
import { User, Building2, Mail, Package, Heart, LogOut, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TabBar from '@/components/TabBar';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Profile = () => {
  const { user, logout, orders, wishlist, creditPeriod, updateCreditPeriod } = useApp();
  const navigate = useNavigate();

  const [selected, setSelected] = useState(creditPeriod || '');

  const handleCreditChange = () => {
    if (!selected) return;
    updateCreditPeriod(selected);
  };

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
      icon: Heart,
      label: 'My Wishlist',
      value: wishlist.length,
      onClick: () => navigate('/wishlist'),
      gradient: 'from-pink-500 to-rose-500',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto p-4">
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account</p>
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
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.businessName}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{user?.businessName}</span>
            </div>
          </div>
        </motion.div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.98 }}
                onClick={item.onClick}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="w-full bg-card rounded-2xl p-5 shadow-lg border border-border hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-lg`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.value} items</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Credit Period Dropdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-5 shadow-md border border-border mt-4"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white shadow-lg">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-lg">Credit Period</p>
              <p className="text-sm text-muted-foreground">
                Select your preferred credit period
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <select
              className="flex-1 border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-background text-sm"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Choose period</option>
              <option value="10">10 days (+5%)</option>
              <option value="15">15 days (+8%)</option>
              <option value="30">30 days (+12%)</option>
              <option value="45">45 days (+15%)</option>
            </select>

            <Button
              onClick={handleCreditChange}
              size="sm"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md"
            >
              Save
            </Button>
          </div>

          {creditPeriod && (
            <p className="text-xs text-muted-foreground mt-2">
              Current Credit Period: <span className="font-semibold">{creditPeriod} days</span>
            </p>
          )}
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-4"
        >
          <Button
            onClick={handleLogout}
            variant="destructive"
            size="lg"
            className="w-full"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </motion.div>
      </main>

      <TabBar />
    </div>
  );
};

export default Profile;
