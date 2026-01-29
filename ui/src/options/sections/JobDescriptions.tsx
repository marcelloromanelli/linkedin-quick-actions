import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Save, Pencil, Trash2 } from 'lucide-react'
import type { JobIndexEntry } from '../hooks'

interface JobDescriptionsProps {
  jobs: JobIndexEntry[]
  editJob: { id?: string; name: string; text: string; impactProfile: string }
  onEditJobChange: (job: { id?: string; name: string; text: string; impactProfile: string }) => void
  onSave: () => void
  onRemove: (id: string, index: number) => void
  onLoadForEdit: (id: string) => void
}

export function JobDescriptions({
  jobs,
  editJob,
  onEditJobChange,
  onSave,
  onRemove,
  onLoadForEdit,
}: JobDescriptionsProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Jobs & Candidate Profiles</h2>
        <p className="text-sm text-white/40 mt-1">
          Define roles and what makes a great candidate for each
        </p>
      </div>

      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        {/* Jobs Table */}
        {jobs.length > 0 && (
          <div className="border-b border-white/[0.06]">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/[0.02] hover:bg-white/[0.02]">
                  <TableHead className="text-xs font-medium text-white/40 uppercase tracking-wider h-10">
                    Role
                  </TableHead>
                  <TableHead className="text-xs font-medium text-white/40 uppercase tracking-wider h-10 text-right w-24">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job, index) => (
                  <TableRow key={job.id} className="group border-white/[0.04]">
                    <TableCell className="text-sm font-medium text-white/80 py-3">
                      {job.name}
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onLoadForEdit(job.id)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onRemove(job.id, index)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add/Edit Form */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-white/40">
            <Plus className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              {editJob.id ? 'Edit Job' : 'Add New Job'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3 space-y-2">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
                Role Name
              </label>
              <Input
                value={editJob.name}
                onChange={(e) => onEditJobChange({ ...editJob, name: e.target.value })}
                placeholder="e.g., Senior Android Engineer"
                className="bg-white/[0.03] border-white/[0.08]"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={onSave} className="w-full gap-2">
                <Save className="w-4 h-4" />
                {editJob.id ? 'Update' : 'Add'}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
              Job Description
            </label>
            <Textarea
              rows={5}
              value={editJob.text}
              onChange={(e) => onEditJobChange({ ...editJob, text: e.target.value })}
              placeholder="Paste the full job description here..."
              className="bg-white/[0.03] border-white/[0.08]"
            />
            <p className="text-xs text-white/30">
              The formal job posting with requirements, responsibilities, and qualifications.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
              Ideal Candidate Profile
            </label>
            <Textarea
              rows={3}
              value={editJob.impactProfile}
              onChange={(e) => onEditJobChange({ ...editJob, impactProfile: e.target.value })}
              placeholder="What makes a great candidate for this role beyond the job description?"
              className="bg-white/[0.03] border-white/[0.08]"
            />
            <p className="text-xs text-white/30">
              Soft skills, team culture fit, and traits that aren&apos;t in the job description.
            </p>
          </div>
          {editJob.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditJobChange({ name: '', text: '', impactProfile: '' })}
            >
              Cancel Edit
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
