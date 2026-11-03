import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { Activity, Team, User, Workout } from '../src/models/index.js';

const app = createApp();
let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([Activity.deleteMany({}), Team.deleteMany({}), User.deleteMany({}), Workout.deleteMany({})]);
});

describe('OctoFit API edge cases', () => {
  it('rejects invalid activity values without saving and computes server-owned fields', async () => {
    const user = await User.create({ name: 'Mona', email: 'mona@example.com', fitnessGoal: 'endurance' });
    const team = await Team.create({ name: 'Octocats', mascot: 'Mona' });
    const input = { userId: user._id.toString(), teamId: team._id.toString(), type: 'run', minutes: 30 };
    for (const invalid of [[], { ...input, type: ' ' }, ...[0, -1, '30', null].map((minutes) => ({ ...input, minutes }))]) {
      expect((await request(app).post('/api/activities').send(invalid)).status).toBe(400);
    }
    expect(await Activity.countDocuments()).toBe(0);
    const response = await request(app).post('/api/activities').send({ ...input, points: 999, occurredAt: 'invalid' });
    expect(response.status).toBe(201);
    expect(response.body.activity.points).toBe(30);
    expect(Number.isNaN(Date.parse(response.body.activity.occurredAt))).toBe(false);
  });

  it('validates team input and allows an omitted members array', async () => {
    for (const invalid of [
      { name: ' ', mascot: 'Mona' },
      { name: 'Octocats' },
      { name: 'Octocats', mascot: 'Mona', members: 'invalid' },
      { name: 'Octocats', mascot: 'Mona', members: ['not-an-id'] },
    ]) {
      expect((await request(app).post('/api/teams').send(invalid)).status).toBe(400);
    }
    const missingMember = await request(app).post('/api/teams').send({
      name: 'Octocats', mascot: 'Mona', members: [new mongoose.Types.ObjectId().toString()],
    });
    expect(missingMember.status).toBe(404);
    expect(await Team.countDocuments()).toBe(0);
    const created = await request(app).post('/api/teams').send({ name: 'Octocats', mascot: 'Mona' });
    expect(created.status).toBe(201);
    expect(created.body.team.members).toEqual([]);
  });

  it('includes zero-point teams with deterministic ranks for ties', async () => {
    expect((await request(app).get('/api/leaderboard')).body.leaderboard).toEqual([]);
    await Team.create([{ name: 'Robocats', mascot: 'Hubot' }, { name: 'Octocats', mascot: 'Mona' }]);
    const response = await request(app).get('/api/leaderboard');
    expect(response.status).toBe(200);
    expect(response.body.leaderboard).toEqual([
      { teamName: 'Octocats', totalPoints: 0, rank: 1 },
      { teamName: 'Robocats', totalPoints: 0, rank: 2 },
    ]);
  });

  it('uses the goal without activities and the latest recognized activity when present', async () => {
    const user = await User.create({ name: 'Mona', email: 'mona@example.com', fitnessGoal: 'strength' });
    const team = await Team.create({ name: 'Octocats', mascot: 'Mona' });
    const path = '/api/workouts/suggestions/mona%40example.com';
    expect((await request(app).get(path)).body.suggestions).toEqual([]);
    await Workout.create([
      { title: 'Intervals', focus: 'endurance', minutes: 30, difficulty: 'moderate' },
      { title: 'Strength Circuit', focus: 'strength', minutes: 30, difficulty: 'moderate' },
    ]);
    const goalResponse = await request(app).get(path);
    expect(goalResponse.status).toBe(200);
    expect(goalResponse.body.suggestions[0]).toMatchObject({ focus: 'strength', reason: expect.stringMatching(/goal/) });
    await Activity.create([
      { user: user._id, team: team._id, type: 'strength', minutes: 20, points: 20, occurredAt: new Date('2026-01-01') },
      { user: user._id, team: team._id, type: 'run', minutes: 30, points: 30, occurredAt: new Date('2026-01-02') },
    ]);
    const activityResponse = await request(app).get(path);
    expect(activityResponse.body.suggestions[0]).toMatchObject({ focus: 'endurance', reason: expect.stringMatching(/run/) });
    expect(activityResponse.body.suggestions).toHaveLength(2);
  });
});
