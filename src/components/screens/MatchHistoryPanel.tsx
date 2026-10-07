import { useState } from 'react';
import { useMatchHistory } from '../../hooks/useMatchHistory';
import { Pagination, PAGINATION_CONFIG } from '../shared/Pagination';
import { QueryPanel } from '../shared/QueryPanel';
import { MatchDate } from '../shared/MatchDate';

export function MatchHistoryPanel({
  playerId,
  playerName,
}: {
  playerId: string;
  playerName: string;
}) {
  const [page, setPage] = useState(1);
  const query = useMatchHistory({
    playerId,
    page,
    pageSize: PAGINATION_CONFIG.pageSize,
  });
  const data = query.data;
  return (
    <>
      <p className="log-subtitle">{playerName} · Your recent battles</p>
      <QueryPanel
        pending={query.isPending}
        failed={query.isError}
        refreshing={query.isFetching && !query.isPending}
        hasData={!!data}
        onRetry={() => void query.refetch()}
      >
        {data?.items.length === 0 ? (
          <p>No recorded matches yet.</p>
        ) : (
          <div className="table-scroll">
            <table className="log-table history-table">
              <caption className="sr-only">Your completed matches</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Points</th>
                  <th scope="col">Duration</th>
                  <th scope="col">Result</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className={
                      page === 1 && index === 0 ? 'highlighted-row' : undefined
                    }
                  >
                    <td>
                      <MatchDate date={entry.completedAt} />
                    </td>
                    <td className="points">{entry.score}</td>
                    <td>
                      {String(Math.floor(entry.elapsedSeconds / 60)).padStart(
                        2,
                        '0',
                      )}
                      :
                      {String(Math.floor(entry.elapsedSeconds % 60)).padStart(
                        2,
                        '0',
                      )}
                    </td>
                    <td
                      className={
                        entry.endReason === 'death'
                          ? 'result-defeated'
                          : 'result-time'
                      }
                    >
                      {entry.endReason === 'death' ? 'Defeated' : 'Time up'}
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
