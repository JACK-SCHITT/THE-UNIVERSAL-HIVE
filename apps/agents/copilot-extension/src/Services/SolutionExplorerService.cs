using Microsoft.VisualStudio.Shell;
using Microsoft.VisualStudio.Shell.Interop;
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Threading.Tasks;

namespace CopilotExtension.Services
{
	public class SolutionExplorerService
	{
		private readonly IVsSolution _solution;

		public SolutionExplorerService()
		{
			ThreadHelper.ThrowIfNotOnUIThread();
			_solution = (IVsSolution)Package.GetGlobalService(typeof(SVsSolution));
		}

		public IEnumerable<string> GetAllProjects()
		{
			ThreadHelper.ThrowIfNotOnUIThread();
			var projects = new List<string>();
			_solution.GetProjectEnum((uint)__VSENUMPROJFLAGS.EPF_LOADED, Guid.Empty, out IEnumHierarchies enumHierarchies);

			IVsHierarchy[] hierarchy = new IVsHierarchy[1];
			uint fetched = 0;

			while (enumHierarchies.Next(1, hierarchy, out fetched) == 0 && fetched == 1)
			{
				hierarchy[0].GetCanonicalName(VSConstants.VSITEMID_ROOT, out string name);
				projects.Add(name);
			}

			return projects;
		}

		public void AddFileToProject(string projectName, string filePath)
		{
			ThreadHelper.ThrowIfNotOnUIThread();
			// TODO: Locate project by name and add file using IVsProject interface
		}

		public void DeleteFile(string filePath)
		{
			if (System.IO.File.Exists(filePath))
			{
				System.IO.File.Delete(filePath);
			}
		}
	}
}
