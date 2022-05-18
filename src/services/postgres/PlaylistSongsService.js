const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');

class PlaylistSongsService {
  constructor(cacheService) {
    this._cacheService = cacheService;
    this._pool = new Pool();
  }

  async addSongToPlaylist(playlistId, songId) {
    const id = `playlistsongs-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlistsongs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new InvariantError('Lagu gagal dimasukan ke dalam playlist');
    }
    await this._cacheService.delete(`playlist:song:${playlistId}`);
    return result.rows[0].id;
  }

  async getSongsInPlaylist(playlistId) {
    try {
      const result = await this._cacheService.get(`playlist:song:${playlistId}`);
      return JSON.parse(result);
    } catch (error) {
      const query = {
        text: `
        SELECT
          s.id AS id,
          s.title AS title,
          s.performer AS performer
        FROM
          songs s
        LEFT JOIN
          playlistsongs ps
        ON
          ps.song_id = s.id
        WHERE ps.playlist_id = $1
        GROUP
          BY s.id`,
        values: [playlistId],
      };
      const songs = await this._pool.query(query);
      await this._cacheService.set(`playlist:song:${playlistId}`, JSON.stringify(songs));
      return songs.rowCount ? songs.rows : [];
    }
  }

  async deleteSongFromPlaylist(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlistsongs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new InvariantError('Lagu gagal dihapus dari playlist');
    }
    await this._cacheService.delete(`playlist:song:${playlistId}`);
  }

  async verifySongIsInPlaylist(playlistId, songId) {
    const query = {
      text: 'SELECT * FROM playlistsongs WHERE playlist_id = $1 AND song_id = $2',
      values: [playlistId, songId],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new InvariantError('Lagu tidak ditemukan di playlist');
    }
  }
}

module.exports = PlaylistSongsService;
