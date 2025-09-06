// import { useState } from 'react';
// import { saveUserPerformance, deleteUserPerformanceFromWeek } from '@/lib/supabase/db';
// import { UserPerformance } from '@/lib/programs/reps-to-failure';

// export function useRepsToFailureCompletion() {
//   const [isUpdating, setIsUpdating] = useState(false);

//   const saveWeekPerformance = async (
//     exerciseId: string,
//     week: number,
//     setsCompleted: number,
//     repsOnLastSet?: number,
//     singleAt8?: number
//   ): Promise<boolean> => {
//     setIsUpdating(true);

//     try {
//       const performanceData: UserPerformance = {
//         week,
//         setsCompleted,
//         repsOnLastSet: repsOnLastSet || 0, // Default to 0 if not provided
//         singleAt8
//       };

//       const success = await saveUserPerformance(Number(exerciseId), week, performanceData);
//       return success;
//     } catch (error) {
//       console.error('Error saving RtF performance:', error);
//       return false;
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
//       console.error('Error reverting RtF performance from week:', error);
//       return false;
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   return {
//     saveWeekPerformance,
//     revertFromWeek,
//     isUpdating
//   };
// }
