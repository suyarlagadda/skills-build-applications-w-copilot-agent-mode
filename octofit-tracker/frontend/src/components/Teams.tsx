import { CapabilityList } from './CapabilityList.js';

type Team = { _id?: string; name: string; mascot?: string; members: string[] };

export default function Teams() {
  return (
    <CapabilityList<Team>
      title="Teams"
      description="Manage teams and members."
      path="/api/teams"
      responseKey="teams"
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
