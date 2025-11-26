// import { useState } from 'react';
// import { motion } from 'framer-motion';
// import { Button } from '@/components/ui/button';
// import { useApp } from '@/contexts/AppContext';

// const CreditPeriodPopup = () => {
//   const { creditPeriod, updateCreditPeriod } = useApp();
//   const [selected, setSelected] = useState(creditPeriod || '');
//   const [visible, setVisible] = useState(!creditPeriod);

//   const handleSubmit = () => {
//     if (!selected) return;
//     updateCreditPeriod(selected);
//     setVisible(false);
//   };

//   if (!visible) return null;

//   return (
//     <motion.div
//       className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//     >
//       <motion.div
//         className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-80 shadow-xl"
//         initial={{ scale: 0.9 }}
//         animate={{ scale: 1 }}
//       >
//         <h2 className="text-lg font-semibold mb-4 text-center">Select Credit Period</h2>
//         <select
//           className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 mb-4 bg-background"
//           value={selected}
//           onChange={(e) => setSelected(e.target.value)}
//         >
//           <option value="">Choose period</option>
//           <option value="10">0 days (+0%)</option>
//           <option value="15">3 days (+4%)</option>
//           <option value="30">8 days (+8%)</option>
//           <option value="45">15 days (+12%)</option>
//           <option value="45">30 days (+15%)</option>
//         </select>

//         <Button onClick={handleSubmit} className="w-full">Confirm</Button>
//       </motion.div>
//     </motion.div>
//   );
// };

// export default CreditPeriodPopup;
