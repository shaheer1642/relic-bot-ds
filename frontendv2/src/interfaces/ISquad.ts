export interface ISquad {
    squad_id: string;
    bot_type: string;
    squad_string: string;
    status: string;
    host_recommendation: { user_id: string, avg_squad_ping: number, considered_ping: boolean }[];
    members: string[];
    squad_host: string;
}
