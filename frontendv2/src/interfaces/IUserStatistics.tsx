
export interface IUserStatistics {
    account_balance: number;
    blessings: {
        hosted: number;
    };
    challenges: {
        total_completed: number;
    };
    giveaways: {
        hosted: number;
        won: number;
    };
    ratings: number[];
    user: {
        ingame_name: string;
    };
    squads: {
        top_squads: {
            hosts: number;
            squad_string: string;
        }[];
        total_squads: {
            all_time: number;
            this_month: number;
            this_week: number;
            today: number;
        };
        total_relic_squads: {
            all_time: number;
            this_month: number;
            this_week: number;
            today: number;
        };
    };
    reputation: {
        total: number;
        squads: number;
        daywave_challenges: number;
        giveaways: number;
        blessings: number;
        user_ratings: number;
    };
}
