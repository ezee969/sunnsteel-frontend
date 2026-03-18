// import { useState } from 'react';
// import { saveUserPerformance, deleteUserPerformanceFromWeek } from '@/lib/supabase/db';
// import { HypertrophyPerformance } from '@/lib/programs/basic-hypertrophy';

// export function useBasicHypertrophyCompletion() {
//   const [isUpdating, setIsUpdating] = useState(false);

//   const setWeekState = async (
//     exerciseId: string,
//     week: number,
//     newState: boolean | null,
//     weight?: number
//   ): Promise<boolean | null> => {
//     setIsUpdating(true);

//     try {
//       if (newState === null) {
//         const performanceData: HypertrophyPerformance = {
//           week,
//           completed: null,
//           weight
//         };

//         const success = await saveUserPerformance(Number(exerciseId), week, performanceData);
//         return success ? null : newState;
//       } else {
//         const performanceData: HypertrophyPerformance = {
//           week,
//           completed: newState,
//           weight
//         };

//         const success = await saveUserPerformance(Number(exerciseId), week, performanceData);
//         return success ? newState : newState;
//       }
//     } catch (error) {
//       console.error('Error setting week state:', error);
//       return newState;
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   const revertFromWeek = async (
//     exerciseId: string,
//     week: number
//   ): Promise<boolean> => {
//     setIsUpdating(true);

//     try {
//       const success = await deleteUserPerformanceFromWeek(Number(exerciseId), week);

//       return success;
//     } catch (error) {
//       console.error('Error reverting from week:', error);
//       return false;
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   return {
//     setWeekState,
//     revertFromWeek,
//     isUpdating
//   };
// }
