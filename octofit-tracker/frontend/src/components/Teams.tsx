import { getJson } from '../api/client.js';
import { CapabilityList } from './CapabilityList.js';

type Team = { _id?: string; name: string; mascot?: string; members: string[] };

async function loadTeams() {
  const response = await getJson<{ teams: Team[] }>('/api/teams');
  return response.teams;
}

export default function Teams() {
  return (
    <CapabilityList<Team>
      title="Teams"
      description="Manage teams and members."
      loadItems={loadTeams}
      emptyText="No teams yet."
      renderItem={(team, index) => (
        <li className="list-group-item" key={team._id ?? index}>
          <h3 className="h5">{team.name}</h3>
          {team.mascot && <p>Mascot: {team.mascot}</p>}
          <p>Members: {team.members.length}</p>
        </li>
      )}
    />
  );
}
