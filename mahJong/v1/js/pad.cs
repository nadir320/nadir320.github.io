using System;
using System.Collections.Generic;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.JSON;
using System.Windows.Forms;
using System.Xml;

namespace ScriptConsole {
	public static class ScriptConsole {
		[STAThread]
		private static void Main() {
			Application.EnableVisualStyles();
			Application.SetCompatibleTextRenderingDefault(false);
			Run();
		}

		public static void Run() {
			PadTiles(@"D:\Data\Home\Dropbox\Web\mahJong\images\tiles.png", 5, 9, 4);
		}

		private static void PadTiles(string fileName, int rows, int columns, int padding) {
			Color backgroundColor = Color.Transparent;

			using (Bitmap source = GetSafeBitmap(fileName)) {
				IEnumerable<Bitmap> tiles = Split(source, rows, columns, backgroundColor);

				try {
					IEnumerable<Bitmap> paddedTiles = tiles.Select((tile) => Pad(tile, padding, backgroundColor));

					try {
						using (Bitmap padded = Join(paddedTiles, rows, columns, backgroundColor)) {
							padded.Save(Path.Combine(Path.GetDirectoryName(fileName),
								string.Concat(Path.GetFileNameWithoutExtension(fileName), @"-padded",
									Path.GetExtension(Path.GetFileName(fileName)))), source.RawFormat);
						}
					} finally {
						foreach (Bitmap paddedTile in paddedTiles) paddedTile.Dispose();
					}
				} finally {
					foreach (Bitmap tile in tiles) tile.Dispose();
				}
			}
		}

		private static IEnumerable<Bitmap> Split(Bitmap source, int rows, int columns, Color backgroundColor) {
			IList<Bitmap> tiles = new List<Bitmap>();

			float x,
				y = 0,
				w = (float)source.Width / columns,
				h = (float)source.Height / rows;

			for (int j = 0; j < rows; j++) {
				x = 0;
				for (int i = 0; i < columns; i++) {
					Bitmap tile = new Bitmap((int)Math.Ceiling(w), (int)Math.Ceiling(h));

					using (Graphics graphics = Graphics.FromImage(tile)) {
						graphics.Clear(backgroundColor);
						graphics.DrawImage(source, 0, 0, new RectangleF(x, y, w, h), GraphicsUnit.Pixel);
					}
					tiles.Add(tile);
					x += w;
				}
				y += h;
			}
			return tiles;
		}

		private static Bitmap Join(IEnumerable<Bitmap> source, int rows, int columns, Color backgroundColor) {
			int i, j, x, y, w, h;

			i = j = x = y = w = h = 0;
			foreach (Bitmap tile in source) {
				x += tile.Width;
				y = Math.Max(y, tile.Height);
				i++;
				if (i == columns) {
					w = Math.Max(w, x);
					h += y;
					x = 0;
					y = 0;
					i = 0;
					j++;
				}
			}

			Bitmap joined = new Bitmap(w, h);

			i = j = x = y = w = h = 0;
			using (Graphics graphics = Graphics.FromImage(joined)) {
				foreach (Bitmap tile in source) {
					graphics.DrawImageUnscaled(tile, x, y);
					x += tile.Width;
					h = Math.Max(h, tile.Height);
					i++;
					if (i == columns) {
						y += h;
						x = 0;
						h = 0;
						i = 0;
						j++;
					}
				}
			}
			return joined;
		}

		private static Bitmap Pad(Bitmap source, int padding, Color backgroundColor) {
			Bitmap padded = new Bitmap(source.Width + 2 * padding, source.Height + 2 * padding);

			using (Graphics graphics = Graphics.FromImage(padded)) {
				graphics.Clear(backgroundColor);
				graphics.DrawImageUnscaled(source, padding, padding);
			}
			return padded;
		}

		private static Bitmap GetSafeBitmap(string fileName) {
			return (Bitmap)Bitmap.FromStream(new MemoryStream(File.ReadAllBytes(fileName)));
		}
	}
}
