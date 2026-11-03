import { isObjectIdOrHexString } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)
    || !('userId' in input) || typeof input.userId !== 'string' || !isObjectIdOrHexString(input.userId)
    || !('teamId' in input) || typeof input.teamId !== 'string' || !isObjectIdOrHexString(input.teamId)
    || !('type' in input) || typeof input.type !== 'string' || !input.type.trim()
    || !('minutes' in input) || typeof input.minutes !== 'number' || !Number.isFinite(input.minutes) || input.minutes <= 0) {
    throw Object.assign(new Error('Provide valid userId, teamId, type, and positive minutes'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.exists({ _id: input.userId }),
    Team.exists({ _id: input.teamId }),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('User or team not found'), { status: 404 });
  }

  return Activity.create({
    user: input.userId,
    team: input.teamId,
    type: input.type,
    minutes: input.minutes,
    points: input.minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)
    || !('name' in input) || typeof input.name !== 'string' || !input.name.trim()
    || !('mascot' in input) || typeof input.mascot !== 'string' || !input.mascot.trim()) {
    throw Object.assign(new Error('Provide a team name and mascot'), { status: 400 });
  }
  const members = 'members' in input ? input.members : [];
  if (!Array.isArray(members)
    || !members.every((member: unknown): member is string => typeof member === 'string' && isObjectIdOrHexString(member))) {
    throw Object.assign(new Error('Members must be an array of valid user IDs'), { status: 400 });
  }
  if (await User.countDocuments({ _id: { $in: members } }) !== new Set(members).size) {
    throw Object.assign(new Error('Team member not found'), { status: 404 });
  }
  return Team.create({ name: input.name, mascot: input.mascot, members });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate<{ teamName: string; totalPoints: number }>([
    { $lookup: { from: Activity.collection.name, localField: '_id', foreignField: 'team', as: 'activities' } },
    { $project: { _id: 0, teamName: '$name', totalPoints: { $sum: '$activities.points' } } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);
  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }
  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1, _id: -1 }).limit(10).lean();
  const activityFocus = new Map([
    ['run', 'endurance'],
    ['cycle', 'endurance'],
    ['walk', 'endurance'],
    ['strength', 'strength'],
    ['yoga', 'mobility'],
    ['stretch', 'mobility'],
  ]);
  const recentActivity = recentActivities.find((activity) => activityFocus.has(activity.type));
  const focus = recentActivity ? activityFocus.get(recentActivity.type) : user.fitnessGoal;
  const basis = recentActivity ? `recent ${recentActivity.type} activity` : `${user.fitnessGoal} fitness goal`;
  const workouts = await Workout.find().sort({ title: 1, _id: 1 }).lean();
  return workouts
    .sort((left, right) => Number(right.focus === focus) - Number(left.focus === focus))
    .map((workout) => ({
      ...workout,
      reason: workout.focus === focus
        ? `Build ${workout.focus} based on your ${basis}.`
        : `Add ${workout.focus} variety alongside your ${basis}.`,
    }));
}

export { User };
