<%@ Page Language="C#" Debug="true" %>
<%@ Import Namespace="System" %>
<%@ Import Namespace="System.IO" %>
<%@ Import Namespace="System.Globalization" %>
<%@ Import Namespace="System.Net" %>
<%@ Import Namespace="System.Text" %>
<%@ Import Namespace="System.Threading" %>
<script runat="server">
	private const string Header_CORS_Headers = @"Access-Control-Allow-Headers",
		Header_CORS_Origin = @"Access-Control-Allow-Origin";

	private const string HttpResponseHeader_ContentDisposition = @"content-disposition",
		HttpResponseHeader_ContentDisposition_Format = @"attachment; filename=""{0}""",
		HttpResponseHeader_ContentLength = @"Content-length";

	private const string MimeType_Audio = @"audio",
		MimeType_Image = @"image",
		MimeType_Stream = @"stream",
		MimeType_Video = @"video";

	private const string Request_Parameter_Broken = @"broken",
		Request_Parameter_BufferSize = @"bufferSize",
		Request_Parameter_Callback = @"callback",
		Request_Parameter_Error = @"error",
		Request_Parameter_Fake = @"fake",
		Request_Parameter_FileName = @"fileName",
		Request_Parameter_Headers = @"headers",
		Request_Parameter_JSONP = @"jsonp",
		Request_Parameter_Length = @"length",
		Request_Parameter_Route = @"route",
		Request_Parameter_Sleep = @"sleep",
		Request_Parameter_Type = @"type",
		Request_Parameter_Wait = @"wait";

	private const string Response_ContentType_Javascript = @"application/javascript; charset=utf-8",
		Response_ContentType_JSON = @"application/json; charset=utf-8",
		Response_ContentType_TextHtml = @"text/html; charset=utf-8",
		Response_Header_Route = "Route",
		Response_JSONP = "{0}({{contents:\"{1}\"}});";

	private const string Backslash = @"\",
		Closed_Brace = @"}",
		Comma = @",",
		Cr = "\r",
		CrString = @"\r",
		Hex4 = @"x4",
		Lf = "\n",
		LfString = @"\n",
		Open_Brace = @"{",
		Quotes = "\"",
		Semicolon = @":",
		Space = @" ",
		Unicode = @"\u";

	private static readonly Regex _nonASCII = new Regex(@"[^\u0000-\u007E]", RegexOptions.Compiled);

	private static string JSONNonASCIIReplacer(Match match) {
		return string.Concat(Unicode, ((int)match.Value[0]).ToString(Hex4));
	}

	private static string JSONPQuoteReplacer(Match match) {
		return string.Concat(match.Value[0], (char)0x005C, (char)0x0022);
	}

	private void LoadPage() {
		/* if (System.Diagnostics.Debugger.IsAttached) System.Diagnostics.Debugger.Break(); */

		/* ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls |
			SecurityProtocolType.Tls11 |
			SecurityProtocolType.Tls12 |
			SecurityProtocolType.Ssl3;

		ServicePointManager.ServerCertificateValidationCallback += (sender, cert, chain, sslPolicyErrors) => true; */

		Response.Headers[Header_CORS_Headers] = ((char)0x002A).ToString();
		Response.Headers[Header_CORS_Origin] = ((char)0x002A).ToString();

		string callback = Request[Request_Parameter_Callback],
			fileName = Request[Request_Parameter_FileName],
			type = Response_ContentType_TextHtml,
			url = Request[Request_Parameter_Route];

		if (!string.IsNullOrEmpty(url)) {
			if (url.IndexOf(Uri.SchemeDelimiter) < 0) {
				url = string.Concat(Request.Url.Scheme, Uri.SchemeDelimiter, url);
			}
		}

		bool broken = false,
			done = false,
			error = false,
			fake = false,
			headers = false;

		int bufferSize = ushort.MaxValue + 1,
			length = bufferSize,
			sleep = 0,
			wait = 0;

		if (string.IsNullOrEmpty(callback)) {
			callback = Request[Request_Parameter_JSONP];
		}
		foreach (string name in Request.QueryString.Keys) {
			if (string.Compare(name, Request_Parameter_Broken, true) == 0) {
				broken = true;
			} else if (string.Compare(name, Request_Parameter_BufferSize, true) == 0) {
				int.TryParse(Request[name], NumberStyles.Integer,
					CultureInfo.InvariantCulture, out bufferSize);
			} else if (string.Compare(name, Request_Parameter_Error, true) == 0) {
				error = true;
			} else if (string.Compare(name, Request_Parameter_Fake, true) == 0) {
				fake = true;
			} else if (string.Compare(name, Request_Parameter_Length, true) == 0) {
				int.TryParse(Request[name], NumberStyles.Integer,
					CultureInfo.InvariantCulture, out length);
			} else if (string.Compare(name, Request_Parameter_Headers, true) == 0) {
				headers = true;
			} else if (string.Compare(name, Request_Parameter_Sleep, true) == 0) {
				int.TryParse(Request[name], NumberStyles.Integer,
					CultureInfo.InvariantCulture, out sleep);
			} else if (string.Compare(name, Request_Parameter_Type, true) == 0) {
				type = Request[name];
			} else if (string.Compare(name, Request_Parameter_Wait, true) == 0) {
				int.TryParse(Request[name], NumberStyles.Integer,
					CultureInfo.InvariantCulture, out wait);
			} else if (string.Compare(name, Request_Parameter_Callback, true) != 0 &&
				string.Compare(name, Request_Parameter_FileName, true) != 0 &&
				string.Compare(name, Request_Parameter_JSONP, true) != 0 &&
				string.Compare(name, Request_Parameter_Route, true) != 0) {

				if (!string.IsNullOrEmpty(url)) {
					url = string.Concat(url, (done) ? (char)0x0026 : (char)0x003F, name,
						(char)0x003D, Request[name]);
				}
				done = true;
			}
		}

		if (fake) {
			if (error) {
				Response.StatusCode = (int)HttpStatusCode.Forbidden;
			} else {
				Response.ContentType = type;
				if (length > 0) {
					Response.Headers[HttpResponseHeader_ContentLength] = Convert.ToString(length, CultureInfo.InvariantCulture);
				}
				if (!string.IsNullOrEmpty(url)) {
					Response.Headers[Response_Header_Route] = url;
				}
				if (!string.IsNullOrEmpty(fileName)) {
					Response.Headers[HttpResponseHeader_ContentDisposition] = string.Format(HttpResponseHeader_ContentDisposition_Format, fileName);
				}

				byte[] buffer = new byte[(length < bufferSize) ?
					length - ((broken) ?
						1 :
						0) :
					bufferSize];

				int written = 0;

				Random random = new Random();

				if (length <= 0) {
					length = random.Next(0x00400000);
				}
				if (wait > 0) {
					Thread.Sleep(wait);
				}
				while (written < length) {
					random.NextBytes(buffer);
					Response.OutputStream.Write(buffer, 0, Math.Min(buffer.Length, length - written));
					Response.OutputStream.Flush();
					Response.Flush();
					written += buffer.Length;
					if (sleep > 0) {
						Thread.Sleep(sleep);
					}
					if (broken) {
						Response.OutputStream.Close();
						Response.Close();
						break;
					}
				}
			}
		} else if (!string.IsNullOrEmpty(url)) {
			HttpWebRequest request = (HttpWebRequest)HttpWebRequest.Create(url);

			request.Method = (headers) ? WebRequestMethods.Http.Head : Request.HttpMethod;
			using (HttpWebResponse response = (HttpWebResponse)request.GetResponse()) {
				Encoding encoding = Encoding.UTF8;

				string contentType;

				if (!string.IsNullOrEmpty(response.ContentEncoding)) {
					try {
						encoding = Encoding.GetEncoding(response.ContentEncoding);
					} catch { }
				}
				if (!string.IsNullOrEmpty(callback)) {
					contentType = Response_ContentType_Javascript;
				} else if (headers) {
					contentType = Response_ContentType_JSON;
				} else {
					contentType = response.ContentType;
					if (string.IsNullOrEmpty(contentType)) {
						contentType = Response_ContentType_JSON;
					}
				}

				Response.ContentEncoding = encoding;
				Response.ContentType = contentType;

				using (Stream stream = response.GetResponseStream()) {
					if (!headers &&
						string.IsNullOrEmpty(callback) &&
						contentType.IndexOf(MimeType_Audio, StringComparison.InvariantCultureIgnoreCase) >= 0 ||
						contentType.IndexOf(MimeType_Stream, StringComparison.InvariantCultureIgnoreCase) >= 0 ||
						contentType.IndexOf(MimeType_Image, StringComparison.InvariantCultureIgnoreCase) >= 0 ||
						contentType.IndexOf(MimeType_Video, StringComparison.InvariantCultureIgnoreCase) >= 0) {

						byte[] buffer = new byte[bufferSize];

						int readBytes, totalBytes = 0;

						Response.Headers[HttpResponseHeader_ContentLength] = response.Headers[HttpResponseHeader.ContentLength];
						if (wait > 0) {
							Thread.Sleep(wait);
						}
						while ((readBytes = stream.Read(buffer, 0, buffer.Length)) > 0) {
							Response.OutputStream.Write(buffer, 0, readBytes);
							Response.OutputStream.Flush();
							Response.Flush();
							if (sleep > 0) {
								Thread.Sleep(sleep);
							}
						}
					} else {
						string result;

						if (headers) {
							StringBuilder builder = new StringBuilder();

							bool first = true;

							builder.Append(Open_Brace);
							foreach (string headerName in response.Headers) {
								if (!first) {
									builder.Append(Comma);
								}

								builder.Append(Quotes);
								builder.Append(headerName);
								builder.Append(Quotes);
								builder.Append(Semicolon);

								object value = response.Headers[headerName];

								string stringValue = Convert.ToString(value, CultureInfo.InvariantCulture);

								double doubleValue;

								bool isNumeric = double.TryParse(stringValue,
									NumberStyles.Any, CultureInfo.InvariantCulture, out doubleValue);

								if (!isNumeric) {
									builder.Append(Quotes);
								}
								builder.Append(stringValue.Replace(Quotes, string.Concat(Backslash, Quotes)));
								if (!isNumeric) {
									builder.Append(Quotes);
								}
								first = false;
							}
							builder.Append(Closed_Brace);
							result = builder.ToString();
						} else {
							using (TextReader reader = new StreamReader(stream, encoding)) {
								result = reader.ReadToEnd();
							}
						}

						if (!string.IsNullOrEmpty(callback)) {
							result = result.Replace(Environment.NewLine, LfString);
							result = result.Replace(Lf, LfString);
							result = result.Replace(Cr, CrString);

							string[] parts = result.Split(new string[] { Quotes, }, StringSplitOptions.None);

							for (int i = 0; i < parts.Length - 1; i++) {
								if (parts[i].Length == 0 || string.Compare(parts[i][parts[i].Length - 1]
									.ToString(), Backslash, false) != 0) {

									parts[i] += Backslash;
								}
							}
							result = string.Join(Quotes, parts);

							result = string.Format(Response_JSONP, callback, result);
						}
						result = _nonASCII.Replace(result, JSONNonASCIIReplacer);
						Response.Write(result);
					}
				}
			}
		}
	}
</script>
<% LoadPage(); %>
