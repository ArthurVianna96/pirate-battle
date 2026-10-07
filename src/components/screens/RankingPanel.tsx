import { useState } from 'react';
import type { GameOptions } from '../../game/support/options';
import { useRanking } from '../../hooks/useRanking';
import { Pagination, PAGINATION_CONFIG } from '../shared/Pagination';
import { QueryPanel } from '../shared/QueryPanel';
import { MatchDate } from '../shared/MatchDate';
import starImage from '../../../assets/png/retina/ui/hud/icon_score.png';

export function RankingPanel({
  options,
  playerId,
}: {
  options: GameOptions;
  playerId: string;
}) {
  const [page, setPage] = useState(1);
  const query = useRanking({
    configuration: options,
    page,
    pageSize: PAGINATION_CONFIG.pageSize,
  });
  const data = query.data;
  return (
    <>
      <p className="log-subtitle">
        {options.sessionDuration} second battles · {options.enemySpawnInterval}{' '}
        second spawn interval
      </p>
      <QueryPanel
        pending={query.isPending}
        failed={query.isError}
        refreshing={query.isFetching && !query.isPending}
        hasData={!!data}
        onRetry={() => void query.refetch()}
      >
        {data?.items.length === 0 ? (
          <p>No scores for this configuration yet.</p>
        ) : (
          <div className="table-scroll">
            <table className="log-table ranking-table">
              <caption className="sr-only">
                Ranking for the selected configuration
              </caption>
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Captain</th>
                  <th scope="col">Points</th>
                  <th scope="col">Played</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((entry) => (
                  <tr
                    key={entry.id}
                    className={
                      entry.player.id === playerId
                        ? 'highlighted-row'
                        : undefined
                    }
                  >
                    <td>{String(entry.rank).padStart(2, '0')}</td>
                    <td>
                      {entry.rank === 1 && (
                        <img className="ranking-star" src={starImage} alt="" />
                      )}
                      {entry.player.name}
                      {entry.player.id === playerId && (
                        <span className="you-badge">You</span>
                      )}
                    </td>
                    <td className="points">{entry.score}</td>
                    <td className="played-date">
                      <MatchDate date={entry.completedAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination {...data} onPageChange={setPage} />}
      </QueryPanel>
    </>
  );
}
